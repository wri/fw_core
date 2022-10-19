export declare class CoverageService {
    private readonly logger;
    getCoverage({ geostoreId, slugs }: {
        geostoreId: any;
        slugs: any;
    }, token: string): Promise<{
        [key: string]: any;
    }>;
}
