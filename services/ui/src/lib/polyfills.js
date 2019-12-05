/* eslint no-extend-native: 0 */
import StringIncludes from 'core-js/es/string/virtual/includes';
import startsWith from 'core-js/es/string/virtual/starts-with';
import ArrayIncludes from 'core-js/es/array/virtual/includes';
import find from 'core-js/es/array/virtual/find';
import findIndex from 'core-js/es/array/virtual/find-index';
import assign from 'core-js/es/object/assign';

String.prototype.includes = StringIncludes;
String.prototype.startsWith = startsWith;
Array.prototype.includes = ArrayIncludes;
Array.prototype.find = find;
Array.prototype.findIndex = findIndex;
Object.assign = assign;
