declare class ResponseError extends Error {
    statusCode: any;
    error: any;
    response: any;
    constructor(statusCode: any, body: any, response: any);
}
