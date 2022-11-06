var realm = $evaluation.getRealm();
var ctx = $evaluation.getContext();
var ctxAttr = ctx.getAttributes();
var validRoles = {
    owner: 1,
    maintainer: 0,
    developer: 0,
    reporter: 0,
    guest: 0,
};

// Check roles calculated by lagoon
if (!ctxAttr.exists('userGroupRole')) {
    $evaluation.deny();
} else {
    var groupRole = ctxAttr.getValue('userGroupRole').asString(0);

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