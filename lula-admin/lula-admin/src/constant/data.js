export const menuItems = [
  {
    isHeadr: true,
    title: "menu",
  },
  {
    title: "Dashboard",
    icon: "heroicons-outline:home",
    link: "/dashboard",
  },
  {
    title: "Platform Access",
    icon: "eos-icons:admin-outlined",
    link: "/dashboard/account",
  },
  {
    title: "Users",
    icon: "mdi:user-outline",
    link: "/dashboard/user",
  },
  {
    title: "Streamers",
    icon: "ic:baseline-live-tv",
    link: "/dashboard/streamer",
  },
  {
    title: "Transactions",
    icon: "heroicons-outline:currency-dollar",
    link: "/dashboard/payment",
  },
  {
    title: "Calls",
    icon: "heroicons-outline:phone",
    link: "/dashboard/calls",
  },
  {
    title: "Payout Requests",
    icon: "ic:baseline-live-tv",
    link: "/dashboard/payout",
  },
  {
    title: "Settings",
    icon: "uil:setting",
    link: "/dashboard/setting",
  },
];

export const topMenu = [];

export const notifications = [];

export const message = [];

export const colors = {
  primary: "#4669FA",
  secondary: "#A0AEC0",
  danger: "#F1595C",
  black: "#111112",
  warning: "#FA916B",
  info: "#0CE7FA",
  light: "#425466",
  success: "#50C793",
  "gray-f7": "#F7F8FC",
  dark: "#1E293B",
  "dark-gray": "#0F172A",
  gray: "#68768A",
  gray2: "#EEF1F9",
  "dark-light": "#CBD5E1",
};

export const hexToRGB = (hex, alpha) => {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);

  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }
};

export const topFilterLists = [];

export const bottomFilterLists = [];

export const meets = [];

export const files = [];
