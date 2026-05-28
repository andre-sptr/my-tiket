declare module 'amadeus' {
  class Amadeus {
    constructor(options: { clientId: string; clientSecret: string; hostname?: string });
    shopping: {
      flightOffersSearch: { get(params: any): Promise<any> };
      flightOffers: { pricing: { post(body: any): Promise<any> } };
      flightDates: { get(params: any): Promise<any> };
      flightDestinations: { get(params: any): Promise<any> };
    };
    referenceData: {
      locations: { get(params: any): Promise<any> };
    };
  }
  export = Amadeus;
}
