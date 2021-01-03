import Sound from 'play-sound';
import app from 'argumental';
import { AppData, PriceState } from './models';
import path from 'path';
const player = Sound({});

export function notify(state: PriceState): Promise<void> {

  return new Promise((resolve, reject) => {

    let filename: string;

    if ( app.data<AppData>().config.gilfoyleMode ) filename = 'napalm';
    else {

      if ( state === PriceState.AboveThreshold ) filename = 'above';
      else if ( state === PriceState.BelowThreshold ) filename = 'below';

    }

    player.play(path.resolve(__dirname, `../assets/${filename}.mp3`), (error: Error) => {

      if ( error ) reject(error);
      else resolve();

    });

  });

}
