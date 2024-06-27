var realm = $evaluation.getRealm();
var ctx = $evaluation.getContext();
var ctxAttr = ctx.getAttributes();

if (!ctxAttr.exists('currentUser')) {
    $evaluation.deny();
} else {
    var currentUser = ctxAttr.getValue('currentUser').asString(0);

    if (realm.isUserInRealmRole(currentUser, 'platform-viewer')) {
        $evaluation.grant();
    } else {
        $evaluation.deny();
    }
}