declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string | string[];
    startTime?: Date;
    endTime?: Date;
    geo?: string;
    hl?: string;
  }

  function interestOverTime(options: TrendsOptions): Promise<string>;
  function interestByRegion(options: TrendsOptions): Promise<string>;

  const googleTrends: {
    interestOverTime: typeof interestOverTime;
    interestByRegion: typeof interestByRegion;
  };

  export default googleTrends;
}