import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import org.mariadb.jdbc.Driver;

import org.keycloak.component.ComponentModel;

public class DbUtil {

    public static Connection getConnection() throws SQLException{
        String driverClass = System.getenv("LAGOON_DB_VENDOR");
        String username = System.getenv("LAGOON_DB_USER");
        String password = System.getenv("LAGOON_DB_PASSWORD");
        String database = System.getenv("LAGOON_DB_DATABASE");
        String host = System.getenv("LAGOON_DB_HOST");
        String port = System.getenv("LAGOON_DB_PORT");

        String jdbcUrl = "jdbc:"+driverClass+"://"+host+":"+port+"/"+database+"?user="+username+"&password="+password;
        return DriverManager.getConnection(jdbcUrl);
    }
}
