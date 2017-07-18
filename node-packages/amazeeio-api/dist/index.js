'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NoActiveSystemsDefined = exports.SiteGroupNotFound = undefined;
exports.siteGroupByGitUrl = siteGroupByGitUrl;
exports.getSiteGroupsByGitUrl = getSiteGroupsByGitUrl;
exports.getSlackinfoForSiteGroup = getSlackinfoForSiteGroup;
exports.getActiveSystemsForSiteGroup = getActiveSystemsForSiteGroup;

var _lokka = require('lokka');

var _lokka2 = _interopRequireDefault(_lokka);

var _lokkaTransportHttp = require('lokka-transport-http');

var _lokkaTransportHttp2 = _interopRequireDefault(_lokkaTransportHttp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var amazeeioapihost = process.env.AMAZEEIO_API_HOST || "http://api:8080";

var graphqlapi = new _lokka2.default({
  transport: new _lokkaTransportHttp2.default(amazeeioapihost + '/graphql')
});

var SiteGroupNotFound = exports.SiteGroupNotFound = function (_Error) {
  _inherits(SiteGroupNotFound, _Error);

  function SiteGroupNotFound(message) {
    _classCallCheck(this, SiteGroupNotFound);

    var _this = _possibleConstructorReturn(this, (SiteGroupNotFound.__proto__ || Object.getPrototypeOf(SiteGroupNotFound)).call(this, message));

    _this.name = 'SiteGroupNotFound';
    return _this;
  }

  return SiteGroupNotFound;
}(Error);

var NoActiveSystemsDefined = exports.NoActiveSystemsDefined = function (_Error2) {
  _inherits(NoActiveSystemsDefined, _Error2);

  function NoActiveSystemsDefined(message) {
    _classCallCheck(this, NoActiveSystemsDefined);

    var _this2 = _possibleConstructorReturn(this, (NoActiveSystemsDefined.__proto__ || Object.getPrototypeOf(NoActiveSystemsDefined)).call(this, message));

    _this2.name = 'NoActiveSystemsDefined';
    return _this2;
  }

  return NoActiveSystemsDefined;
}(Error);

function siteGroupByGitUrl(gitUrl) {
  var result;
  return regeneratorRuntime.async(function siteGroupByGitUrl$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(graphqlapi.query('\n    {\n      siteGroup:siteGroupByGitUrl(giturl: "' + gitUrl + '"){\n        siteGroupName\n        slack\n        openshift\n      }\n    }\n  '));

        case 2:
          result = _context.sent;

          if (!(result.siteGroup != null)) {
            _context.next = 7;
            break;
          }

          return _context.abrupt('return', result.siteGroup);

        case 7:
          throw new SiteGroupNotFound('Cannot find site information for git repo ' + gitUrl);

        case 8:
        case 'end':
          return _context.stop();
      }
    }
  }, null, this);
}

function getSiteGroupsByGitUrl(gitUrl) {
  var result;
  return regeneratorRuntime.async(function getSiteGroupsByGitUrl$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(graphqlapi.query('\n    {\n      allSiteGroups(giturl: "' + gitUrl + '") {\n        edges {\n          node {\n            siteGroupName\n            slack\n            openshift\n          }\n        }\n      }\n    }\n  '));

        case 2:
          result = _context2.sent;

          if (!(result.allSiteGroups.edges.length != 0)) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt('return', result.allSiteGroups.edges.map(function (edge) {
            return edge.node;
          }));

        case 7:
          throw new SiteGroupNotFound('Cannot find site information for git repo ' + gitUrl);

        case 8:
        case 'end':
          return _context2.stop();
      }
    }
  }, null, this);
}

function getSlackinfoForSiteGroup(siteGroup) {
  var result;
  return regeneratorRuntime.async(function getSlackinfoForSiteGroup$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(graphqlapi.query('\n    {\n      siteGroup:siteGroupByName(name: "' + siteGroup + '"){\n        slack\n      }\n    }\n  '));

        case 2:
          result = _context3.sent;

          if (!result.siteGroup.slack) {
            _context3.next = 7;
            break;
          }

          return _context3.abrupt('return', result.siteGroup);

        case 7:
          throw new SiteGroupNotFound('Cannot find site information for siteGroup ' + siteGroup);

        case 8:
        case 'end':
          return _context3.stop();
      }
    }
  }, null, this);
}

function getActiveSystemsForSiteGroup(siteGroup, task) {
  var result;
  return regeneratorRuntime.async(function getActiveSystemsForSiteGroup$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(graphqlapi.query('\n    {\n      siteGroup:siteGroupByName(name: "' + siteGroup + '"){\n        activeSystems\n      }\n    }\n  '));

        case 2:
          result = _context4.sent;

          if (!(result.siteGroup != null)) {
            _context4.next = 11;
            break;
          }

          if (!result.siteGroup.hasOwnProperty('activeSystems')) {
            _context4.next = 8;
            break;
          }

          return _context4.abrupt('return', result.siteGroup.activeSystems);

        case 8:
          throw new NoActiveSystemsDefined('Cannot find active systems for siteGroup ' + siteGroup);

        case 9:
          _context4.next = 12;
          break;

        case 11:
          throw new SiteGroupNotFound('Cannot find SiteGroup: ' + siteGroup);

        case 12:
        case 'end':
          return _context4.stop();
      }
    }
  }, null, this);
}