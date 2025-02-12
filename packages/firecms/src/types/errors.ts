export class ApiError extends Error {

    public code?: string;
    public projectId?: string;

    static fromError(error: any, projectId?: string) {
        return new ApiError(error.message ?? error.error, error.code, projectId); //return new this(props); also works
    }

    constructor(message: string, code?: string, projectId?: string) {
        super(message);
        this.code = code;
        this.projectId = projectId;
    }
}
