var realm = $evaluation.getRealm();
var ctx = $evaluation.getContext();
var ctxAttr = ctx.getAttributes();

// Check projects calculated by lagoon
if (!ctxAttr.exists('projectQuery') || !ctxAttr.exists('userProjects')) {
    $evaluation.deny();
} else {
    var project = ctxAttr.getValue('projectQuery').asString(0);
    var projects = ctxAttr.getValue('userProjects').asString(0);
    var projectsArr = projects.split('-');
    var grant = false;

    for (var i=0; i<projectsArr.length; i++) {
        if (project == projectsArr[i]) {
            grant = true;
            break;
        }
    }

    if (grant) {
        $evaluation.grant();
    } else {
        $evaluation.deny();
    }
}

// Check admin access
if (ctxAttr.exists('currentUser')) {
    var currentUser = ctxAttr.getValue('currentUser').asString(0);

    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {
        $evaluation.grant();
    }
}