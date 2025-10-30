type ProjectConfig = {
    backendUrl: string;
}

export const projectConfig: ProjectConfig = {
    backendUrl: import.meta.env.VITE_IOTDP_BACKEND_URL,
};
