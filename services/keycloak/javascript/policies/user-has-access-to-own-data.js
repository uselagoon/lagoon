var ctx = $evaluation.getContext();
var ctxAttr = ctx.getAttributes();

if (!ctxAttr.exists('usersQuery') || !ctxAttr.exists('currentUser')) {
    $evaluation.deny();
} else {
    var currentUser = ctxAttr.getValue('currentUser').asString(0);
    var users = ctxAttr.getValue('usersQuery').asString(0);
    var usersArr = users.split('|');
    var grant = false;
    
    for (var i=0; i<usersArr.length; i++) {
        if (currentUser == usersArr[i]) {
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