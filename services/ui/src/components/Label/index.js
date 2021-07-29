import React from 'react';
import { Icon, Image, Label as SemanticLabel } from 'semantic-ui-react';
import { getSiteStatusFromCode, mapStatusToIcon } from 'components/SiteStatus/logic';

const matchFactToIcon = (name) => {
  switch (name) {
    case "site-code-status":
      return {
        icon: "globe",
        color: "grey"
      }
    case "drupal-core":
      return {
        icon: "drupal",
        color: "blue"
      };
      break;

    case "laravel/framework":
      return  {
        icon: "laravel",
        color: "red"
      };
      break;

    case "Lagoon":
      return  {
        icon: "",
        color: "teal"
      };

    case "php-version":
      return  {
        icon: "php",
        color: "black"
      };
      break;

    case "express":
    case "nodejs":
    case "node-version":
      return  {
        icon: "node js",
        color: "green"
      };
      break;

    case "python":
      return  {
        icon: "python",
        color: "grey"
      };
      break;

    case "reactjs":
      return  {
        icon: "react",
        color: "blue"
      };
      break;

    case "java":
      return  {
        icon: "java",
        color: "orange"
      };
      break;

    case "gatsby":
      return  {
        icon: "gatsby",
        color: "purple"
      };
      break;

    case "go-lang":
      return  {
        icon: "go",
        color: "teal"
      };
      break;

    default:
      return { icon: name, color: "grey" };
      break;
  }
}

const Label = ({ text, icon, color, value }) => {
  if (icon) {
    let foundIcon = {};
    if (icon === "Lagoon" || icon === "lagoon-category") {
      return (
        <SemanticLabel>
          <Image className="lagoon-logo" size="mini" src="/static/images/lagoon-2.svg" avatar /><>{text}</>
        </SemanticLabel>
      )
    }

    if (icon === "site-code-status") {
      const siteStatus = getSiteStatusFromCode(value);
      foundIcon = {
        icon: mapStatusToIcon(siteStatus),
        color: "grey"
      }
    }
    else {
      foundIcon = matchFactToIcon(icon);
    }

    return (
      <SemanticLabel>
        <Icon name={foundIcon.icon} color={color ? color : foundIcon.color}/>{text}
      </SemanticLabel>
    );
  };

  return (
    <SemanticLabel>
      {text}
    </SemanticLabel>
  );
};

export default Label;
