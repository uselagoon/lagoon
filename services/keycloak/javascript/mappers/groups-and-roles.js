var ArrayList = Java.type("java.util.ArrayList");
var HashMap = Java.type("java.util.HashMap");
var HashSet = Java.type("java.util.HashSet");

var groupsAndRoles = new ArrayList();
var groupProjectIds = new HashMap();
var projectGroupProjectIds = new HashMap();

var forEach = Array.prototype.forEach;
// add all groups the user is part of
forEach.call(user.getGroups().toArray(), function(group) {
  // remove the group role suffixes
  // lets check if the group has a parent if this is a child
  var groupName = group.getName().replace(/-(owner|maintainer|developer|reporter|guest)$/,"");
  if(group.getFirstAttribute("type") == "role-subgroup") {
    var parent = group.getParent();
    var projectIds = parent.getFirstAttribute("lagoon-projects");
    if(parent.getFirstAttribute("type") == "project-default-group") {
      if(projectIds !== null) {
        forEach.call(projectIds.split(","), function(g) {
          projectGroupProjectIds.put(g, groupName)
        });
        return;
      }
    } else {
      if(projectIds !== null) {
        // add the group so group-tenant association works properly
        groupsAndRoles.add(groupName);
        // calculate the groupprojectids
        forEach.call(projectIds.split(","), function(g) {
          groupProjectIds.put(g, groupName)
        });
        return;
      }
    }
  }
  return;
});

// remove all the groupprojectids from the individual projectgroupprojectids so that all
// that remains are project ids that are not already associated to an existing group
projectGroupProjectIds.keySet().removeAll(groupProjectIds.keySet());
for each (var e in projectGroupProjectIds.keySet()) {
    groupsAndRoles.add("p"+e);
}

// add all roles the user is part of
forEach.call(user.getRoleMappings().toArray(), function(role) {
  var roleName = role.getName();
  groupsAndRoles.add(roleName);
});
exports = groupsAndRoles;
