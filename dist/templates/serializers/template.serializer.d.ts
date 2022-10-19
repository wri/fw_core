declare const serializeTemplate: (data: any) => {
    type: string;
    id: any;
    attributes: {};
} | {
    type: string;
    id: any;
    attributes: {};
}[];
export default serializeTemplate;
