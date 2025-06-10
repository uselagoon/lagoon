package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
)

type handleUserActionUser struct {
	//Id           string `json:"id"`
	Email        string `json:"email"`
	Organization int    `json:"organization"`
	Role         string `json:"role"`
}

type handleUserActionResource struct {
	//Id      int    `json:"id"`
	Type    string `json:"type"`
	Details string `json:"details"` // stores the org name
}

// There is also a third payload struct called "linkedResource" which we could use, but it seems redundant

type handleUserActionPayload struct {
	Meta struct {
		Payload struct {
			User                   handleUserActionUser    `json:"user"`
			UserActionEmailDetails *UseractionEmailDetails `json:"userActionEmailDetails,omitempty"`
		} `json:"payload"`
	} `json:"meta"`
}

// These are the basic details that should be piped to the email template
type UseractionEmailDetails struct {
	Name             string `json:"name,omitempty"`
	Email            string `json:"email,omitempty"`
	Role             string `json:"role,omitempty"`
	OrganizationName string `json:"organizationName,omitempty"`
}

func (h *Messaging) handleUserActionToEmail(notification *Notification, rawPayload []byte) error {
	var payload handleUserActionPayload
	if err := json.Unmarshal(rawPayload, &payload); err != nil {
		return err
	}
	// let's check if we need to send an email
	if payload.Meta.Payload.UserActionEmailDetails == nil {
		if h.EnableDebug {
			log.Printf("Skipping email for '%v' event, user:%s\n", notification.Meta.Event, payload.Meta.Payload.User.Email)
		}
		return nil
	} else {
		if h.EnableDebug {
			log.Printf("Sending email for '%v' event, user:%s\n", notification.Meta.Event, payload.Meta.Payload.User.Email)
		}
	}

	useractionEmailDetails := *payload.Meta.Payload.UserActionEmailDetails

	switch notification.Meta.Event {
	case "api:addAdminToOrganization":
		return h.addAdminToOrganization(useractionEmailDetails)
	case "api:removeAdminFromOrganization":
		return h.removeAdminFromOrganization(useractionEmailDetails)
	case "api:addPlatformRoleToUser":
		return h.addPlatformRoleToUser(useractionEmailDetails)
	case "api:removePlatformRoleFromUser":
		return h.removePlatformRoleFromUser(useractionEmailDetails)
	}
	return errors.New(fmt.Sprintf("Unable to match incoming notification: %v", notification))
}

func (h *Messaging) addPlatformRoleToUser(valuesStruct UseractionEmailDetails) error {

	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been assigned the platform role of <strong>{{.Role}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`

	mainHTML, err := templateGenerator(content, valuesStruct, h.EmailBase64Logo)
	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v granted platform role %v", valuesStruct.Name, valuesStruct.Role)
	subject := fmt.Sprintf("User %s Lagoon platform role was updated", valuesStruct.Name)
	if err != nil {
		return fmt.Errorf("error generating email template for addPlatformRoleToUser event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}

	err = h.simpleMail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for addPlatformRoleToUser event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}
	return nil
}

func (h *Messaging) removePlatformRoleFromUser(valuesStruct UseractionEmailDetails) error {

	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been removed from the platform role of <strong>{{.Role}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`

	mainHTML, err := templateGenerator(content, valuesStruct, h.EmailBase64Logo)
	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v removed from platform role %v", valuesStruct.Name, valuesStruct.Role)
	subject := fmt.Sprintf("User %s Lagoon platform role was updated", valuesStruct.Name)
	if err != nil {
		return fmt.Errorf("error generating email template for addPlatformRoleToUser event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}

	err = h.simpleMail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for addPlatformRoleToUser event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}
	return nil
}

func (h *Messaging) addAdminToOrganization(valuesStruct UseractionEmailDetails) error {
	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been assigned the role of 
  <strong>{{.Role}}</strong> in the organization <strong>{{.OrganizationName}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`
	mainHTML, err := templateGenerator(content, valuesStruct, h.EmailBase64Logo)
	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v granted role %v on organization %v", valuesStruct.Name, valuesStruct.Role, valuesStruct.OrganizationName)
	subject := fmt.Sprintf("User %s role updated for Organization: %v", valuesStruct.Name, valuesStruct.OrganizationName)
	if err != nil {
		return fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}

	err = h.simpleMail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for addAdminToOrganization event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}
	return nil
}

func (h *Messaging) removeAdminFromOrganization(valuesStruct UseractionEmailDetails) error {
	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been removed from the organization <strong>{{.OrganizationName}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`

	mainHTML, err := templateGenerator(content, valuesStruct, h.EmailBase64Logo)
	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v removed from organization %v", valuesStruct.Name, valuesStruct.OrganizationName)
	subject := fmt.Sprintf("User %s removed from Organization: %v", valuesStruct.Name, valuesStruct.OrganizationName)
	if err != nil {
		return fmt.Errorf("error generating email template for removing user %s and from organization %s: %v", valuesStruct.Email, valuesStruct.OrganizationName, err)
	}

	err = h.simpleMail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email when removing user %s and from organization %s: %v", valuesStruct.Email, valuesStruct.OrganizationName, err)
	}
	return nil
}
