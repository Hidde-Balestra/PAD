const serverPort = 3000;
const baseUrl = location.hostname === "localhost"
    ? `${location.protocol}//${location.hostname}:${serverPort}`
    : `/api`;