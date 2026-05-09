import { calculateResult } from './resultEngine.js';
import './poll.js';
import './viewer.js';
import './systems.js';

const selectedClass = "class6"; // default
const classDataCache = {};

async function loadClassData(className = selectedClass) {
  if (!classDataCache[className]) {
    const { default: classData } = await import(`../data/${className}.js`);
    classDataCache[className] = classData;
  }
  window.selectedClass = className;
  window.BPClassData = classDataCache[className];
  window.BPClassDataByClass = classDataCache;
  return classDataCache[className];
}

window.BPLoadClassData = loadClassData;
window.BPResultEngine = { calculateResult };

await loadClassData(selectedClass);
