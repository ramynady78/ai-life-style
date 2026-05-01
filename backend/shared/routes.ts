export const API_ROUTES = {
  health: {
    get: "/api/health",
  },
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    currentUser: "/api/auth/me",
    updateCurrentUser: "/api/auth/me",
    changePassword: "/api/auth/change-password",
    deleteCurrentUser: "/api/auth/me",
  },
  profile: {
    create: "/api/profile/create",
    me: "/api/profile/me",
    update: "/api/profile/update",
  },
  recommendation: {
    generatePlan: "/api/recommendation/generate-plan",
    active: "/api/recommendation/active",
  },
  tracking: {
    listMeasurements: "/api/tracking/measurements",
    createMeasurement: "/api/tracking/measurements",
    listAdherence: "/api/tracking/adherence",
    createAdherence: "/api/tracking/adherence",
  },
  nutrition: {
    today: "/api/nutrition/today",
  },
  chat: {
    listMessages: "/api/chat/messages",
    sendMessage: "/api/chat/messages",
    clearMessages: "/api/chat/messages",
  },
} as const;
