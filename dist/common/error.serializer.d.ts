declare class ErrorSerializer {
    static serializeValidationError(data: any, typeParam: any): {
        source: {
            parameter: string;
        };
        code: string;
        title: string;
        detail: any;
    };
    static serializeValidationBodyErrors(data: any): {
        errors: any[];
    };
    static serializeError(status: any, message: any): {
        errors: {
            status: any;
            detail: any;
        }[];
    };
}
export default ErrorSerializer;
