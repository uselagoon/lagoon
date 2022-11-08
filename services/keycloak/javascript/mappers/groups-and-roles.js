var ArrayList = Java.type("java.util.ArrayList");
var groupsAndRoles = new ArrayList();
var forEach = Array.prototype.forEach;

// add all groups the user is part of
forEach.call(user.getGroups().toArray(), function(group) {
  // remove the group role suffixes
  //lets check if the group has a parent if this is a child
  if(group.getFirstAttribute("type") == "role-subgroup") {
    var parent = group.getParent();
    if(parent.getFirstAttribute("type") == "project-default-group") {
        var projectIds = parent.getFirstAttribute("lagoon-projects");
        if(projectIds !== null) {
            forEach.call(projectIds.split(","), function(g) {
              groupsAndRoles.add("p" + g);
            });
            return;
        }
    }
  }

  var groupName = group.getName().replace(/-owner|-maintainer|-developer|-reporter|-guest/gi,"");
  groupsAndRoles.add(groupName);
  return;
});

// add all roles the user is part of
forEach.call(user.getRoleMappings().toArray(), function(role) {
   var roleName = role.getName();
   groupsAndRoles.add(roleName);
});

exports = groupsAndRoles;
