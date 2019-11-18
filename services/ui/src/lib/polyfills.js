/* eslint no-extend-native: 0 */
import StringIncludes from 'core-js/library/fn/string/virtual/includes';
import startsWith from 'core-js/library/fn/string/virtual/starts-with';
import ArrayIncludes from 'core-js/library/fn/array/virtual/includes';
import find from 'core-js/library/fn/array/virtual/find';
import findIndex from 'core-js/library/fn/array/virtual/find-index';
import assign from 'core-js/library/fn/object/assign';

String.prototype.includes = StringIncludes;
String.prototype.startsWith = startsWith;
Array.prototype.includes = ArrayIncludes;
Array.prototype.find = find;
Array.prototype.findIndex = findIndex;
Object.assign = assign
