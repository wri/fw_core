declare const serializeAssignments: (data: any) => {
    type: string;
    id: any;
    attributes: {};
} | {
    type: string;
    id: any;
    attributes: {};
}[];
export default serializeAssignments;
