import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.protocol.oidc.mappers.*;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.AccessToken;
import org.jboss.logging.Logger;

import org.keycloak.models.IdentityProviderMapperModel;
import org.keycloak.models.RealmModel;
import org.keycloak.models.GroupModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.utils.KeycloakModelUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Iterator;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class CustomOIDCProtocolMapper extends AbstractOIDCProtocolMapper implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {

    public static final String PROVIDER_ID = "lagoon-search-customprotocolmapper";

    private static final Logger logger = Logger.getLogger(CustomOIDCProtocolMapper.class);

    private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

    /**
     * Maybe you want to have config fields for your Mapper
     */
    /*
    static {
        ProviderConfigProperty property;
        property = new ProviderConfigProperty();
        property.setName(ProtocolMapperUtils.USER_ATTRIBUTE);
        property.setLabel(ProtocolMapperUtils.USER_MODEL_ATTRIBUTE_LABEL);
        property.setHelpText(ProtocolMapperUtils.USER_MODEL_ATTRIBUTE_HELP_TEXT);
        property.setType(ProviderConfigProperty.STRING_TYPE);
        configProperties.add(property);

        property = new ProviderConfigProperty();
        property.setName(ProtocolMapperUtils.MULTIVALUED);
        property.setLabel(ProtocolMapperUtils.MULTIVALUED_LABEL);
        property.setHelpText(ProtocolMapperUtils.MULTIVALUED_HELP_TEXT);
        property.setType(ProviderConfigProperty.BOOLEAN_TYPE);
        configProperties.add(property);

    }
     */
    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return configProperties;
    }

    @Override
    public String getDisplayCategory() {
        return TOKEN_MAPPER_CATEGORY;
    }

    @Override
    public String getDisplayType() {
        return "Lagoon Project Group Mapper";
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public String getHelpText() {
        return "A mapper that can retrieve groups and projects from the lagoon API to store in the token";
    }

    public AccessToken transformAccessToken(AccessToken token, ProtocolMapperModel mappingModel, KeycloakSession keycloakSession,
                                            UserSessionModel userSession, ClientSessionContext clientSessionCtx) {

        List<Object> groupsAndRoles = new ArrayList();
        Map<String, String> groupProjectIds = new HashMap();
        Map<String, String> projectGroupProjectIds = new HashMap();
        UserModel user = userSession.getUser();
        Set<GroupModel> groups = user.getGroupsStream().collect(Collectors.toSet());;
        for (GroupModel group : groups) {
            if(group.getFirstAttribute("type").equals("role-subgroup")) {
                GroupModel parent = group.getParent();
                String parentName = parent.getName();
                List<String> projectIds = new ArrayList();
                try (Connection c = DbUtil.getConnection()) {
                    PreparedStatement statement = c.prepareStatement("SELECT project_id FROM kc_group_projects WHERE group_id='"+parent.getId()+"'");
                    ResultSet resultSet = statement.executeQuery();
                    while (resultSet.next()) {
                        projectIds.add(resultSet.getString(1));
                    }
                }
                catch(Exception ex) {
                    // don't throw an exception, just log and continue so that the token still generates
                    logger.tracef("Issue connecting to database to perform query on group id %s: %v", parent.getId(), ex);
                }
                String temp = parent.getFirstAttribute("type");
                String result = "";
                if(temp != null && !temp.isEmpty()){
                    result = temp;
                }
                if(result.equals("project-default-group")) {
                    if(projectIds != null) {
                        for (String projectId : projectIds) {
                            projectGroupProjectIds.put(projectId, parentName);
                        };
                    }
                } else {
                    if(projectIds != null) {
                        // add the group so group-tenant association works properly
                        groupsAndRoles.add(parentName);
                        // calculate the groupprojectids
                        for (String projectId : projectIds) {
                            groupProjectIds.put(projectId, parentName);
                        };
                    }
                }
            }
        };
        // that remains are project ids that are not already associated to an existing group
        projectGroupProjectIds.keySet().removeAll(groupProjectIds.keySet());

        for (Object projectId : projectGroupProjectIds.keySet()) {
            groupsAndRoles.add("p"+projectId);
        }

        // add all roles the user is part of
        Set<RoleModel> userRoles = user.getRoleMappingsStream().collect(Collectors.toSet());
        for (RoleModel role : userRoles) {
            String roleName = role.getName();
            groupsAndRoles.add(roleName);
        };

        token.getOtherClaims().put("groups", groupsAndRoles);

        setClaim(token, mappingModel, userSession, keycloakSession, clientSessionCtx);
        return token;
    }

    public static ProtocolMapperModel create(String name,
                                             boolean accessToken, boolean idToken, boolean userInfo) {
        ProtocolMapperModel mapper = new ProtocolMapperModel();
        mapper.setName(name);
        mapper.setProtocolMapper(PROVIDER_ID);
        mapper.setProtocol(OIDCLoginProtocol.LOGIN_PROTOCOL);
        Map<String, String> config = new HashMap<String, String>();
        config.put(OIDCAttributeMapperHelper.INCLUDE_IN_ACCESS_TOKEN, "true");
        config.put(OIDCAttributeMapperHelper.INCLUDE_IN_ID_TOKEN, "true");
        config.put(OIDCAttributeMapperHelper.INCLUDE_IN_USERINFO, "true");
        mapper.setConfig(config);
        return mapper;
    }


}
