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
        forEach.call(projectIds.split(","), function(g) {
          groupProjectIds.put(g, groupName)
        });
        return;
      }
    }
  }
  return;
});

// add all the unique project ids roles the user has, that aren't in an already existing group
projectGroupProjectIds.keySet().removeAll(groupProjectIds.keySet());
for each (var e in projectGroupProjectIds.keySet()) groupsAndRoles.add("p"+e);

// now add all the users groups
var uniqueGroups = new HashSet(groupProjectIds.values());
for each (var e in uniqueGroups) groupsAndRoles.add(e);

// add all roles the user is part of
forEach.call(user.getRoleMappings().toArray(), function(role) {
  var roleName = role.getName();
  groupsAndRoles.add(roleName);
});
exports = groupsAndRoles;
