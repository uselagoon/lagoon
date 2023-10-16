var realm = $evaluation.getRealm();
var ctx = $evaluation.getContext();
var ctxAttr = ctx.getAttributes();

if (!ctxAttr.exists('organizationQuery') || !ctxAttr.exists('userOrganizations')) {
    $evaluation.deny();
} else {
    var organization = ctxAttr.getValue('organizationQuery').asString(0);
    var organizations = ctxAttr.getValue('userOrganizations').asString(0);
    var organizationsArr = organizations.split(',');
    var grant = false;

    for (var i=0; i<organizationsArr.length; i++) {
        if (organization == organizationsArr[i]) {
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

if (ctxAttr.exists('currentUser')) {
    var currentUser = ctxAttr.getValue('currentUser').asString(0);

    if (realm.isUserInRealmRole(currentUser, 'platform-owner')) {
        $evaluation.grant();
    }
}