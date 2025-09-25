import { generateFcQRCodeURL, generateEcfQRCodeURL } from '../generateQRCode';
import { ENVIRONMENT } from '../../networking';

describe('generateQRCode', () => {
  describe('generateFcQRCodeURL', () => {
    /**
     * Test basic functionality of generateFcQRCodeURL
     */
    it('should generate correct FC QR URL with basic parameters', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).toBe(
        'https://fc.dgii.gov.do/testecf/consultatimbrefc?rncemisor=130862346&encf=E310004567002&montototal=180000&codigoseguridad=BucMq7'
      );
    });

    /**
     * Test encoding of special characters in codigoseguridad parameter
     * This addresses the issue where encodeURI() doesn't encode reserved characters
     */
    it('should properly encode plus sign (+) in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'Buc+Mq7', // Contains plus sign
        ENVIRONMENT.DEV
      );

      expect(url).toBe(
        'https://fc.dgii.gov.do/testecf/consultatimbrefc?rncemisor=130862346&encf=E310004567002&montototal=180000&codigoseguridad=Buc%2BMq7'
      );
      expect(url).toContain('codigoseguridad=Buc%2BMq7');
      expect(url).not.toContain('codigoseguridad=Buc+Mq7');
    });

    /**
     * Test encoding of question mark (?) in codigoseguridad
     */
    it('should properly encode question mark (?) in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'Buc?Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%3FMq7');
      expect(url).not.toContain('codigoseguridad=Buc?Mq7');
    });

    /**
     * Test encoding of forward slash (/) in codigoseguridad
     */
    it('should properly encode forward slash (/) in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'Buc/Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%2FMq7');
      expect(url).not.toContain('codigoseguridad=Buc/Mq7');
    });

    /**
     * Test encoding of colon (:) in codigoseguridad
     */
    it('should properly encode colon (:) in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'Buc:Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%3AMq7');
      expect(url).not.toContain('codigoseguridad=Buc:Mq7');
    });

    /**
     * Test encoding of at symbol (@) in codigoseguridad
     */
    it('should properly encode at symbol (@) in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'Buc@Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%40Mq7');
      expect(url).not.toContain('codigoseguridad=Buc@Mq7');
    });

    /**
     * Test encoding of ampersand (&) in codigoseguridad
     */
    it('should properly encode ampersand (&) in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'Buc&Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%26Mq7');
      expect(url).not.toContain('codigoseguridad=Buc&Mq7');
    });

    /**
     * Test encoding of equals sign (=) in codigoseguridad
     */
    it('should properly encode equals sign (=) in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'Buc=Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%3DMq7');
      expect(url).not.toContain('codigoseguridad=Buc=Mq7');
    });

    /**
     * Test encoding of hash symbol (#) in codigoseguridad
     */
    it('should properly encode hash symbol (#) in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'Buc#Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%23Mq7');
      expect(url).not.toContain('codigoseguridad=Buc#Mq7');
    });

    /**
     * Test encoding of multiple special characters in codigoseguridad
     */
    it('should properly encode multiple special characters in codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'B+u?c/M:q@7&=#',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=B%2Bu%3Fc%2FM%3Aq%407%26%3D%23');
    });

    /**
     * Test encoding of special characters in other parameters
     */
    it('should properly encode special characters in rncemisor', () => {
      const url = generateFcQRCodeURL(
        '130862346+test',
        'E310004567002',
        180000.00,
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('rncemisor=130862346%2Btest');
    });

    it('should properly encode special characters in encf', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002+test',
        180000.00,
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('encf=E310004567002%2Btest');
    });

    /**
     * Test different environments
     */
    it('should generate correct URL for CERT environment', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'BucMq7',
        ENVIRONMENT.CERT
      );

      expect(url).toBe(
        'https://fc.dgii.gov.do/certecf/consultatimbrefc?rncemisor=130862346&encf=E310004567002&montototal=180000&codigoseguridad=BucMq7'
      );
    });

    it('should generate correct URL for PROD environment', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'BucMq7',
        ENVIRONMENT.PROD
      );

      expect(url).toBe(
        'https://fc.dgii.gov.do/ecf/consultatimbrefc?rncemisor=130862346&encf=E310004567002&montototal=180000&codigoseguridad=BucMq7'
      );
    });

    /**
     * Test edge cases
     */
    it('should handle empty codigoseguridad', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        '',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=');
    });

    it('should handle zero montototal', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        0,
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('montototal=0');
    });

    it('should handle decimal montototal', () => {
      const url = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.50,
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('montototal=180000.5');
    });
  });

  describe('generateEcfQRCodeURL', () => {
    /**
     * Test basic functionality of generateEcfQRCodeURL
     */
    it('should generate correct ECF QR URL with basic parameters', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).toBe(
        'https://ecf.dgii.gov.do/testecf/consultatimbre?rncemisor=130862346&RncComprador=111111&encf=E310004567002&fechaemision=13-11-2022&montototal=180000.00&fechafirma=14-11-2023%2003%3A05%3A27&codigoseguridad=BucMq7'
      );
    });

    /**
     * Test encoding of special characters in codigoseguridad parameter
     */
    it('should properly encode plus sign (+) in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'Buc+Mq7', // Contains plus sign
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%2BMq7');
      expect(url).not.toContain('codigoseguridad=Buc+Mq7');
    });

    /**
     * Test encoding of all special characters in codigoseguridad
     */
    it('should properly encode question mark (?) in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'Buc?Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%3FMq7');
    });

    it('should properly encode forward slash (/) in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'Buc/Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%2FMq7');
    });

    it('should properly encode colon (:) in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'Buc:Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%3AMq7');
    });

    it('should properly encode at symbol (@) in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'Buc@Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%40Mq7');
    });

    it('should properly encode ampersand (&) in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'Buc&Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%26Mq7');
    });

    it('should properly encode equals sign (=) in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'Buc=Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%3DMq7');
    });

    it('should properly encode hash symbol (#) in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'Buc#Mq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=Buc%23Mq7');
    });

    /**
     * Test encoding of multiple special characters
     */
    it('should properly encode multiple special characters in codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'B+u?c/M:q@7&=#',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=B%2Bu%3Fc%2FM%3Aq%407%26%3D%23');
    });

    /**
     * Test RncComprador exclusion for E43 and E47 types
     */
    it('should exclude RncComprador for E43 type', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E430004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).not.toContain('RncComprador=111111');
      expect(url).toBe(
        'https://ecf.dgii.gov.do/testecf/consultatimbre?rncemisor=130862346&encf=E430004567002&fechaemision=13-11-2022&montototal=180000.00&fechafirma=14-11-2023%2003%3A05%3A27&codigoseguridad=BucMq7'
      );
    });

    it('should exclude RncComprador for E47 type', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E470004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).not.toContain('RncComprador=111111');
      expect(url).toBe(
        'https://ecf.dgii.gov.do/testecf/consultatimbre?rncemisor=130862346&encf=E470004567002&fechaemision=13-11-2022&montototal=180000.00&fechafirma=14-11-2023%2003%3A05%3A27&codigoseguridad=BucMq7'
      );
    });

    it('should exclude RncComprador for e43 type (lowercase)', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'e430004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).not.toContain('RncComprador=111111');
    });

    it('should exclude RncComprador for e47 type (lowercase)', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'e470004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).not.toContain('RncComprador=111111');
    });

    /**
     * Test empty RncComprador
     */
    it('should exclude RncComprador when empty', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).not.toContain('RncComprador=');
      expect(url).toBe(
        'https://ecf.dgii.gov.do/testecf/consultatimbre?rncemisor=130862346&encf=E310004567002&fechaemision=13-11-2022&montototal=180000.00&fechafirma=14-11-2023%2003%3A05%3A27&codigoseguridad=BucMq7'
      );
    });

    /**
     * Test encoding of special characters in date fields
     */
    it('should properly encode spaces and colons in fechafirma', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('fechafirma=14-11-2023%2003%3A05%3A27');
    });

    /**
     * Test different environments
     */
    it('should generate correct URL for CERT environment', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.CERT
      );

      expect(url).toBe(
        'https://ecf.dgii.gov.do/certecf/consultatimbre?rncemisor=130862346&RncComprador=111111&encf=E310004567002&fechaemision=13-11-2022&montototal=180000.00&fechafirma=14-11-2023%2003%3A05%3A27&codigoseguridad=BucMq7'
      );
    });

    it('should generate correct URL for PROD environment', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.PROD
      );

      expect(url).toBe(
        'https://ecf.dgii.gov.do/ecf/consultatimbre?rncemisor=130862346&RncComprador=111111&encf=E310004567002&fechaemision=13-11-2022&montototal=180000.00&fechafirma=14-11-2023%2003%3A05%3A27&codigoseguridad=BucMq7'
      );
    });

    /**
     * Test edge cases
     */
    it('should handle empty codigoseguridad', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        '',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('codigoseguridad=');
    });

    it('should handle zero montototal', () => {
      const url = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '0.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'BucMq7',
        ENVIRONMENT.DEV
      );

      expect(url).toContain('montototal=0.00');
    });
  });

  /**
   * Test cases that demonstrate the problem described in the issue:
   * encodeURI() doesn't encode reserved characters with special meaning in URIs
   */
  describe('Encoding Issue Regression Tests', () => {
    it('should demonstrate the difference between encodeURI and encodeURIComponent for plus sign', () => {
      const testString = 'test+code';

      // This would be the problematic behavior if using encodeURI
      const encodedWithEncodeURI = encodeURI(testString);
      expect(encodedWithEncodeURI).toBe('test+code'); // Plus sign is NOT encoded

      // This is the correct behavior using encodeURIComponent
      const encodedWithEncodeURIComponent = encodeURIComponent(testString);
      expect(encodedWithEncodeURIComponent).toBe('test%2Bcode'); // Plus sign IS encoded
    });

    it('should demonstrate that our functions use encodeURIComponent correctly', () => {
      // Test that our function properly encodes the plus sign
      const urlWithPlus = generateFcQRCodeURL(
        '130862346',
        'E310004567002',
        180000.00,
        'test+code',
        ENVIRONMENT.DEV
      );

      // Verify that the plus sign is properly encoded as %2B
      expect(urlWithPlus).toContain('codigoseguridad=test%2Bcode');

      // Verify that it doesn't contain the unencoded plus sign
      expect(urlWithPlus).not.toContain('codigoseguridad=test+code');
    });

    it('should prevent server from interpreting plus as space in codigoseguridad', () => {
      // When a URL contains an unencoded plus sign, servers interpret it as a space
      // Our encoding should prevent this by converting + to %2B

      const urlWithPlus = generateEcfQRCodeURL(
        '130862346',
        '111111',
        'E310004567002',
        '180000.00',
        '13-11-2022',
        '14-11-2023 03:05:27',
        'ABC+123+XYZ',
        ENVIRONMENT.DEV
      );

      // The plus signs should be encoded as %2B to prevent server misinterpretation
      expect(urlWithPlus).toContain('codigoseguridad=ABC%2B123%2BXYZ');
      expect(urlWithPlus).not.toContain('codigoseguridad=ABC+123+XYZ');
    });
  });
});