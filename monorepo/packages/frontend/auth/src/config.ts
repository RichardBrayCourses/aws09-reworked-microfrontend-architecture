// see https://vite.dev/guide/env-and-mode
const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
const cognitoClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

export const authConfig = {
  cognitoDomain,
  cognitoClientId,
};
