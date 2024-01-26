var realm = $evaluation.getRealm();
var ctx = $evaluation.getContext();
var ctxAttr = ctx.getAttributes();
var validRoles = {
    owner: 1,
    maintainer: 1,
    developer: 1,
    reporter: 1,
    guest: 0,
};

// Check roles calculated by lagoon
if (!ctxAttr.exists('userProjectRole')) {
    $evaluation.deny();
} else {
    var groupRole = ctxAttr.getValue('userProjectRole').asString(0);

    if (validRoles[groupRole.toLowerCase()]) {
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