#!/usr/bin/env node
import 'source-map-support/register';
import app from 'argumental';
import Binance from 'node-binance-api';
import chalk from 'chalk';
import { notify } from './sound';
import { AppData, PriceState, DataUpdate } from './models';
import { apiCredsExist } from './validators';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';

app
.version(require(path.resolve(__dirname, '../package.json')).version)

// Read config
.global
.on('validators:before', async () => {

  const configPath = path.resolve(os.homedir(), '.binance-notifier', 'config.json');

  if ( ! await fs.pathExists(configPath) )
    await fs.outputJSON(configPath, { markets: {} });

  app.data<AppData>().configPath = configPath;
  app.data<AppData>().config = await fs.readJSON(configPath);

})

// Config commands
.command('set key', 'sets the Binance API key')
.argument('<key>', 'the Binance API key to use')
.validate(app.STRING)
.action(args => {

  app.data<AppData>().config.key = args.key;

})

.command('set secret', 'sets the Binance API secret')
.argument('<secret>', 'the Binance API secret to use')
.validate(app.STRING)
.action(args => {

  app.data<AppData>().config.secret = args.secret;

})

.command('set gilfoyle', 'sets the notification sound to Gilfoyle mode')
.argument('<value>', 'either true or false')
.validate(app.BOOLEAN)
.action(args => {

  app.data<AppData>().config.gilfoyleMode = args.value;

})

// Market command
.command('add market', 'adds a crypto market to the watch list')
.argument('<market>', 'a market name')
.validate(apiCredsExist)
.validate(app.STRING)
.sanitize(value => value.toUpperCase().replace(/\//g, '').trim())
.argument('<target>', 'a target value as the threshold')
.validate(app.NUMBER)
.action(async args => {

  app.data<AppData>().config.markets[args.market] = args.target;

})

// Start command
.command('start', 'starts monitoring the market prices and notifies when thresholds are met')
.action(() => {

  const binance = new Binance().options({
    APIKEY: app.data<AppData>().config.key,
    APISECRET: app.data<AppData>().config.secret
  });

  const data: DataUpdate = {};
  let logged: boolean = false;

  // Populate base data with unknown state
  for ( const name in app.data<AppData>().config.markets ) {

    data[name] = {
      price: NaN,
      threshold: app.data<AppData>().config.markets[name],
      state: PriceState.Unknown,
      notified: false
    };

  }

  // Helper functions
  function renderOutput(data: DataUpdate): string {

    let output = '';

    for ( const name in data ) {

      output += `${chalk.whiteBright.bold(name.padEnd(10, ' '))} `;

      let color: chalk.Chalk;

      if ( data[name].state === PriceState.Unknown ) color = chalk.dim;
      else if ( data[name].state === PriceState.AboveThreshold ) color = chalk.greenBright;
      else if ( data[name].state === PriceState.BelowThreshold ) color = chalk.redBright;
      else color = chalk.white;

      output += `${color(data[name].price ?? 'NA')} ${chalk.dim(`(${data[name].threshold})`)}\n`;

    }

    return output;

  }

  function getPriceState(threshold: number, price: number): PriceState {

    if ( price < threshold ) return PriceState.BelowThreshold;
    else if ( price === threshold ) return PriceState.AtThreshold;
    else return PriceState.AboveThreshold;

  }

  // Open websocket
  binance.websockets.trades(Object.keys(app.data<AppData>().config.markets), async (trades: any) => {

    // First data
    if ( data[trades.s].state === PriceState.Unknown ) {

      data[trades.s].price = trades.p;
      data[trades.s].state = getPriceState(app.data<AppData>().config.markets[trades.s], trades.p);

    }
    // Update
    else {

      data[trades.s].price = trades.p;

      const newState = getPriceState(data[trades.s].threshold, trades.p);

      if ( newState !== data[trades.s].state ) {

        data[trades.s].state = newState;
        data[trades.s].notified = false;

      }

    }

    // Play sound if necessary
    if ( ! data[trades.s].notified ) {

      data[trades.s].notified = true;
      await notify(data[trades.s].state);

    }

    // Render output and update the console
    const output = renderOutput(data);
    const linesCount = output.split('\n').length - 1;

    if ( logged ) {

      process.stdout.moveCursor(0, -linesCount);
      process.stdout.clearScreenDown();

    }

    process.stdout.write(output);
    logged = true;

  });

})

// Save config
.global
.on('actions:after', async () => {

  await fs.outputJSON(app.data<AppData>().configPath, app.data<AppData>().config);

})

.parse(process.argv);
