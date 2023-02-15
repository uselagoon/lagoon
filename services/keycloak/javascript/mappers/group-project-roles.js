var ArrayList = Java.type("java.util.ArrayList");
var HashMap = Java.type("java.util.HashMap");
var HashSet = Java.type("java.util.HashSet");
var groupProjectIds = new HashMap();

var groups = user.getGroups()

var forEach = Array.prototype.forEach;
// add all groups the user is part of
forEach.call(groups.toArray(), function(group) {
    var groupName = group.getName().replace(/-(owner|maintainer|developer|reporter|guest)$/,"");
    var groupRoles = group.getRoleMappings();
    if(group.getFirstAttribute("type") == "role-subgroup") {
        var parent = group.getParent();
        var projectIds = parent.getFirstAttribute("lagoon-projects");
        if(groupRoles.length == 1) {
            groupRoles.forEach(function(roleModel) {
                var rn = roleModel.getName();
                // array of project ids
                var projectIdList = new ArrayList();
                if(projectIds !== null) {
                    var splitIds = new ArrayList(projectIds.split(","))
                    forEach.call(splitIds, function(g) {
                        projectIdList.add(parseInt(g))
                    });
                    if (groupProjectIds[rn]) {
                        if (groupProjectIds[rn].length > 0) {
                            for(var a=0; a < groupProjectIds[rn].length; a++){
                                if (!splitIds.contains(groupProjectIds[rn][a])) {
                                    projectIdList.add(parseInt(groupProjectIds[rn][a]))
                                }
                            }
                        }
                    }
                }
                if (projectIdList.length > 0) {
                    groupProjectIds.put(rn, projectIdList)
                }
            });
            return;
        }
    }
    return;
});

token.setOtherClaims("project_group_roles", groupProjectIds);