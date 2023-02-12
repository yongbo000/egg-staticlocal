module.exports = appInfo => {
  return {
    staticlocal: {
      enable: appInfo.env === 'local',
    },
  };
};
