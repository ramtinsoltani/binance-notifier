import app from 'argumental';
import os from 'os';
import { AppData, PriceState } from './models';
import path from 'path';
import child from 'child_process';

export function notify(state: PriceState): Promise<void> {

  return new Promise((resolve, reject) => {

    let filename: string;

    if ( app.data<AppData>().config.gilfoyleMode ) filename = 'napalm';
    else {

      if ( state === PriceState.AboveThreshold ) filename = 'above';
      else if ( state === PriceState.BelowThreshold ) filename = 'below';

    }

    // Windows: Use /assets/player.exe to play the sound
    if ( os.type() === 'Windows_NT' ) {

      child.exec(`"${path.resolve(__dirname, '..', 'assets', 'player.exe')}" "${path.resolve(__dirname, '..', 'assets', filename + '.mp3')}"`, error => {

        if ( error ) reject(error);
        else resolve();

      });

    }
    // MacOS: Use the built-in command 'afplay' to play the sound
    else if ( os.type() === 'Darwin' ) {

      child.exec(`afplay ${path.resolve(__dirname, '..', 'assets', filename + '.mp3').replace(/ /g, '\\ ')}`, error => {

        if ( error ) reject(error);
        else resolve();

      });

    }

  });

}
