export const filteredItems = (projects, statusSelected, frameworkSelected, languageSelected, searchInput) => projects.filter(key => {

  // Select / tag filters
  const filterByStatus= key.status && key.status.toLowerCase().includes(statusSelected.toLowerCase());



  let filterByName = '';
  filterByName = key.name && key.name
    .toLowerCase()
    .includes(searchInput.toLowerCase());
  // }
  let filterByUrl = '';
  if (key.environments[0] !== void 0) {
    if (key.environments[0].route !== null) {
      filterByUrl = key.environments[0].route
        .toLowerCase()
        .includes(searchInput.toLowerCase());
    }
  }

  let filterByFact = '';
  if (key.environments[0] !== void 0) {
    if (key.environments[0].facts) {
      filterByFact = key.environments[0].facts.map(fact => {
        return fact.value.toLowerCase().includes(searchInput.toLowerCase());
      })
    }
  }

  const factChecker = arr => arr.includes(true);

  return ['name', 'environments', 'facts', '__typename'].includes(key)
    ? false
    : (true && filterByName) || filterByStatus || filterByUrl || factChecker(filterByFact);
});

