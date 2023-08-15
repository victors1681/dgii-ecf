import {
  NoReceivedCode,
  ReveivedStatus,
  SenderReceiver,
} from '../SenderReceiver';
import { DOMParser } from '@xmldom/xmldom';

import fs from 'fs';
import path from 'path';

describe('Utils tests', () => {
  const senderReciver = new SenderReceiver();

  it('Get ECF Data from XML for confirmation receive', () => {
    try {
      const data = fs.readFileSync(
        path.resolve(__dirname, './sample/invoice_received.xml'),
        'utf8'
      );

      const response = senderReciver.getECFDataFromXML(
        data,
        '130862346',
        ReveivedStatus['e-CF Recibido']
      );
      console.log(response);
      const xmlDoc = new DOMParser().parseFromString(response, 'text/xml');
      const Estado = xmlDoc.getElementsByTagName('Estado')[0].textContent;

      expect(Estado).toBe(ReveivedStatus['e-CF Recibido']);
    } catch (err) {
      console.error('Error reading file:', err);
    }
  });

  it('Reeiving a ECF from another customer', () => {
    try {
      const data = fs.readFileSync(
        path.resolve(__dirname, './sample/invoice_received.xml'),
        'utf8'
      );

      const response = senderReciver.getECFDataFromXML(
        data,
        'MY_RNC', //Simulation when the current RNC is receiving not corresponded NCF
        ReveivedStatus['e-CF Recibido']
      );
      const xmlDoc = new DOMParser().parseFromString(response, 'text/xml');
      const Estado = xmlDoc.getElementsByTagName('Estado')[0].textContent;
      const CodigoMotivoNoRecibido = xmlDoc.getElementsByTagName(
        'CodigoMotivoNoRecibido'
      )[0].textContent;

      expect(Estado).toBe(ReveivedStatus['e-CF No Recibido']);
      expect(CodigoMotivoNoRecibido).toBe(
        NoReceivedCode['RNC Comprador no corresponde']
      );
    } catch (err) {
      console.error('Error reading file:', err);
    }
  });

  it('Reeiving a wrong eNCF type', () => {
    try {
      const data = fs.readFileSync(
        path.resolve(__dirname, './sample/invoice_received_worng_type.xml'),
        'utf8'
      );

      const response = senderReciver.getECFDataFromXML(
        data,
        '130862346', //Simulation when the current RNC is receiving not corresponded NCF
        ReveivedStatus['e-CF Recibido']
      );
      const xmlDoc = new DOMParser().parseFromString(response, 'text/xml');
      const Estado = xmlDoc.getElementsByTagName('Estado')[0].textContent;
      const CodigoMotivoNoRecibido = xmlDoc.getElementsByTagName(
        'CodigoMotivoNoRecibido'
      )[0].textContent;

      expect(Estado).toBe(ReveivedStatus['e-CF No Recibido']);
      expect(CodigoMotivoNoRecibido).toBe(
        NoReceivedCode['Error de especificación']
      );
    } catch (err) {
      console.error('Error reading file:', err);
    }
  });
});
