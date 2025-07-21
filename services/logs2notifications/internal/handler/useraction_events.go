package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
)

type handleUserActionUser struct {
	Email        string `json:"email"`
	Organization int    `json:"organization"`
	Role         string `json:"role"`
}

type handleUserActionResource struct {
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
	Keyname          string `json:"keyname,omitempty"`   // for ssh keys
	Groupname        string `json:"groupname,omitempty"` // for groups
}

func (h *Messaging) handleUserActionToEmail(notification *Notification, rawPayload []byte) error {
	var payload handleUserActionPayload
	if err := json.Unmarshal(rawPayload, &payload); err != nil {
		return err
	}
	// let's check if we need to send an email
	if payload.Meta.Payload.UserActionEmailDetails == nil {
		if h.EnableDebug {
			log.Printf("Skipping email for '%v' event - payload: %v\n", notification.Meta.Event, string(rawPayload))
		}
		return nil
	} else {
		log.Printf("Sending email for '%v' event, user:%s\n", notification.Meta.Event, payload.Meta.Payload.UserActionEmailDetails.Email)
	}

	useractionEmailDetails := *payload.Meta.Payload.UserActionEmailDetails

	switch notification.Meta.Event {
	case "api:addUserToOrganization", "api:addAdminToOrganization":
		return h.addAdminToOrganization(useractionEmailDetails)
	case "api:removeUserFromOrganization", "api:removeAdminFromOrganization":
		return h.removeAdminFromOrganization(useractionEmailDetails)
	case "api:addPlatformRoleToUser":
		return h.addPlatformRoleToUser(useractionEmailDetails)
	case "api:removePlatformRoleFromUser":
		return h.removePlatformRoleFromUser(useractionEmailDetails)
	case "api:deleteSshKey", "api:deleteSshKeyById":
		return h.addEditRemoveSshKeyEmailMessage(useractionEmailDetails, notification.Meta.Event, "deleted")
	case "api:updateSshKey":
		return h.addEditRemoveSshKeyEmailMessage(useractionEmailDetails, notification.Meta.Event, "updated")
	case "api:addSshKey":
		return h.addEditRemoveSshKeyEmailMessage(useractionEmailDetails, notification.Meta.Event, "added")
	case "api:addUserToGroup":
		return h.groupAddEmailMessage(useractionEmailDetails, notification.Meta.Event)
	case "api:removeUserFromGroup":
		return h.groupRemoveEmailMessage(useractionEmailDetails, notification.Meta.Event)
	}
	return errors.New(fmt.Sprintf("Unable to match incoming notification: %v", notification))
}

func (h *Messaging) groupAddEmailMessage(valuesStruct UseractionEmailDetails, event string) error {

	content := `
<p>Hello,</p>

<p>
  You have been added to the group <strong>{{.Groupname}}</strong> with the role <strong>{{.Role}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`

	templateGenerator := NewTemplateDataGenerator(content, h.EmailTemplate, h.EmailBase64Logo)
	mainHTML, err := templateGenerator.Generate(struct {
		Name      string
		Groupname string
		Role      string
	}{
		Name:      valuesStruct.Name,
		Groupname: valuesStruct.Groupname,
		Role:      valuesStruct.Role,
	})

	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v added to group %v with the role %v", valuesStruct.Name, valuesStruct.Groupname, valuesStruct.Role)
	subject := fmt.Sprintf("User %s has been added to a group", valuesStruct.Name)
	if err != nil {
		return fmt.Errorf("error generating email template for %s event %s: %v", valuesStruct.Email, event, err)
	}

	err = h.simpleMail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for %s event %s: %v", valuesStruct.Email, event, err)
	}
	return nil
}

func (h *Messaging) groupRemoveEmailMessage(valuesStruct UseractionEmailDetails, event string) error {

	content := `
<p>Hello,</p>

<p>
  You have been removed from the group <strong>{{.Groupname}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`

	templateGenerator := NewTemplateDataGenerator(content, h.EmailTemplate, h.EmailBase64Logo)
	mainHTML, err := templateGenerator.Generate(struct {
		Name      string
		Groupname string
	}{
		Name:      valuesStruct.Name,
		Groupname: valuesStruct.Groupname,
	})

	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v removed from group %v", valuesStruct.Name, valuesStruct.Groupname)
	subject := fmt.Sprintf("User %s has been removed from a group", valuesStruct.Name)
	if err != nil {
		return fmt.Errorf("error generating email template for %s event %s: %v", valuesStruct.Email, event, err)
	}

	err = h.simpleMail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for %s event %s: %v", valuesStruct.Email, event, err)
	}
	return nil
}

func (h *Messaging) addEditRemoveSshKeyEmailMessage(valuesStruct UseractionEmailDetails, event, action string) error {

	content := `
<p>Hello,</p>

<p>
  You have {{.Action}} an SSH key {{if .Keyname}} <strong>{{.Keyname}}</strong> {{end}}
</p>
`

	templateGenerator := NewTemplateDataGenerator(content, h.EmailTemplate, h.EmailBase64Logo)
	mainHTML, err := templateGenerator.Generate(struct {
		Name    string
		Action  string
		Keyname string
	}{
		Name:    valuesStruct.Name,
		Action:  action,
		Keyname: valuesStruct.Keyname,
	})

	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v %v ssh key", valuesStruct.Name, action)
	subject := fmt.Sprintf("User %s has %v an ssh key", valuesStruct.Name, action)
	if err != nil {
		return fmt.Errorf("error generating email template for %s event %s and project %s: %v", event, valuesStruct.Email, valuesStruct.Role, err)
	}

	err = h.simpleMail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for %s event %s and project %s: %v", event, valuesStruct.Email, valuesStruct.Role, err)
	}
	return nil
}

func (h *Messaging) addPlatformRoleToUser(valuesStruct UseractionEmailDetails) error {

	content := `
<p>Hello,</p>

<p>
  You have been assigned the platform role of <strong>{{.Role}}</strong>.
</p>
`

	templateGenerator := NewTemplateDataGenerator(content, h.EmailTemplate, h.EmailBase64Logo)
	mainHTML, err := templateGenerator.Generate(valuesStruct)
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
  You have been removed from the platform role of <strong>{{.Role}}</strong>.
</p>
`

	templateGenerator := NewTemplateDataGenerator(content, h.EmailTemplate, h.EmailBase64Logo)
	mainHTML, err := templateGenerator.Generate(valuesStruct)
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
  You have been assigned the role of <strong>{{.Role}}</strong> in the organization <strong>{{.OrganizationName}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`
	templateGenerator := NewTemplateDataGenerator(content, h.EmailTemplate, h.EmailBase64Logo)
	mainHTML, err := templateGenerator.Generate(valuesStruct)
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
  You have been removed from the organization <strong>{{.OrganizationName}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`

	templateGenerator := NewTemplateDataGenerator(content, h.EmailTemplate, h.EmailBase64Logo)
	mainHTML, err := templateGenerator.Generate(valuesStruct)
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
