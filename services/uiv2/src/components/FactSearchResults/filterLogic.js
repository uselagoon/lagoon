const stringInputFilter = (results, searchInput) => results.filter(key => {

  const produtionEnvs = key.environments ? key.environments.filter(e => e.environmentType === "production") : key;
  const environment = produtionEnvs.length ? [...produtionEnvs].shift(): key;

  let filterByName = '';
  filterByName = key.name && key.name
    .toLowerCase()
    .includes(searchInput.toLowerCase());

  let filterByRoute = '';
  if (environment !== void 0) {
    if (environment.route) {
      filterByRoute = environment.route
        .toLowerCase()
        .includes(searchInput.toLowerCase());
    }
  }

  let filterByFact = '';
  if (environment !== void 0) {
    if (environment.facts) {
      filterByFact = environment.facts.map(fact => {
        return fact.value.toLowerCase().includes(searchInput.toLowerCase());
      })
    }
  }

  const factChecker = arr => arr.includes(true);

  return ['name', 'environments', 'route', 'facts', '__typename'].includes(key)
    ? false
    : (true && filterByName) || filterByRoute || factChecker(filterByFact);
});

export default stringInputFilter;