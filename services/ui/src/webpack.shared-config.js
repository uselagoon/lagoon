const path = require('path');

module.exports = {
  extensions: ['.ts', '.tsx', '.js'],
  alias: {
    components: path.join(__dirname, 'components'),
    layouts: path.join(__dirname, 'layouts'),
    lib: path.join(__dirname, 'lib'),
    pages: path.join(__dirname, 'pages'),
  },
};
