import {
  NoReceivedCode,
  ReceivedStatus,
  SenderReceiver,
} from '../SenderReceiver';
import { DOMParser } from '@xmldom/xmldom';

import fs from 'fs';
import path from 'path';

describe('Utils tests', () => {
  const senderReceiver = new SenderReceiver();

  it('Get ECF Data from XML for confirmation receive', () => {
    try {
      const data = fs.readFileSync(
        path.resolve(__dirname, './sample/invoice_received.xml'),
        'utf8'
      );

      const response = senderReceiver.getECFDataFromXML(
        data,
        '130862346',
        ReceivedStatus['e-CF Recibido']
      );
      const xmlDoc = new DOMParser().parseFromString(response, 'text/xml');
      const Estado = xmlDoc.getElementsByTagName('Estado')[0].textContent;

      expect(Estado).toBe(ReceivedStatus['e-CF Recibido']);
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

      const response = senderReceiver.getECFDataFromXML(
        data,
        'MY_RNC', //Simulation when the current RNC is receiving not corresponded NCF
        ReceivedStatus['e-CF Recibido']
      );
      const xmlDoc = new DOMParser().parseFromString(response, 'text/xml');
      const Estado = xmlDoc.getElementsByTagName('Estado')[0].textContent;
      const CodigoMotivoNoRecibido = xmlDoc.getElementsByTagName(
        'CodigoMotivoNoRecibido'
      )[0].textContent;

      expect(Estado).toBe(ReceivedStatus['e-CF No Recibido']);
      expect(CodigoMotivoNoRecibido).toBe(
        NoReceivedCode['RNC Comprador no corresponde']
      );
    } catch (err) {
      console.error('Error reading file:', err);
    }
  });

  it('Receiving a wrong eNCF type', () => {
    try {
      const data = fs.readFileSync(
        path.resolve(__dirname, './sample/invoice_received_wrong_type.xml'),
        'utf8'
      );

      const response = senderReceiver.getECFDataFromXML(
        data,
        '130862346', //Simulation when the current RNC is receiving not corresponded NCF
        ReceivedStatus['e-CF Recibido']
      );
      const xmlDoc = new DOMParser().parseFromString(response, 'text/xml');
      const Estado = xmlDoc.getElementsByTagName('Estado')[0].textContent;
      const CodigoMotivoNoRecibido = xmlDoc.getElementsByTagName(
        'CodigoMotivoNoRecibido'
      )[0].textContent;

      expect(Estado).toBe(ReceivedStatus['e-CF No Recibido']);
      expect(CodigoMotivoNoRecibido).toBe(
        NoReceivedCode['Error de especificación']
      );
    } catch (err) {
      console.error('Error reading file:', err);
    }
  });

  it('test convertion', () => {
    const data = fs.readFileSync(
      path.resolve(__dirname, './sample/body_response.txt'),
      'utf8'
    );
    const xmlDoc = senderReceiver.parseBody(data);
    const xmlResponse = senderReceiver.getECFDataFromXML(
      xmlDoc,
      '130862346',
      ReceivedStatus['e-CF Recibido']
    );
    const eNCF = xmlDoc.getElementsByTagName('eNCF')[0].textContent;

    expect(eNCF).toBe('E310000000002');

    //Validate response
    const resDom = new DOMParser().parseFromString(xmlResponse, 'text/xml');
    const Estado = resDom.getElementsByTagName('Estado')[0].textContent;
    expect(Estado).toBe('0');
  });
});
