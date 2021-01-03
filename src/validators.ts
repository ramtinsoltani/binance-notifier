import app from 'argumental';
import { AppData } from './models';

export function apiCredsExist(): void {

  if ( ! app.data<AppData>().config.key || ! app.data<AppData>().config.secret )
    throw new Error('API key and secret must be set prior to using the Binance API!');

}
