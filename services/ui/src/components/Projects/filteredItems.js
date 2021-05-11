export const filteredItems = (projects, categorySelected, searchInput) => projects.filter(key => {
  const filterByCategory = key.category && key.category.toLowerCase().includes(categorySelected.toLowerCase())

  const filterByName = key.name
    .toLowerCase()
    .includes(searchInput.toLowerCase());

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
    : (true && filterByName) || filterByCategory || filterByUrl || factChecker(filterByFact);
});

