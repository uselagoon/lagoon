package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"text/template"
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

// We're introducing a branch new resource struct to deal with email details
type emailActionResource struct {
	Email        string `json:"email"`
	Organization string `json:"organization"`
	Role         string `json:"role"`
}

// There is also a third payload struct called "linkedResource" which we could use, but it seems redundant

type handleUserActionPayload struct {
	Meta struct {
		Payload struct {
			SendUserEmail bool                     `json:"sendUserEmail"`
			User          handleUserActionUser     `json:"user"`
			Resource      handleUserActionResource `json:"resource"`
			EmailDetails  *emailActionResource     `json:"emailDetails,omitempty"`
		} `json:"payload"`
	} `json:"meta"`
}

// These are the basic details that should be piped to the email template
type UseractionEmailDetails struct {
	Name    string
	Email   string
	Role    string
	Orgname string
}

// SendToEmail .
func (h *Messaging) useractionEmailTemplate(details *UseractionEmailDetails) (string, string, error) {

	var mainHTML, plainText, plainTextTpl, mainHTMLTpl string

	// let's load the email templates from dist
	// load the file from disk

	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been assigned the role of 
  <strong>{{.Role}}</strong> in the organization <strong>{{.Orgname}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`

	values := map[string]string{
		"Name":    details.Name,
		"Email":   details.Email,
		"Role":    details.Role,
		"Orgname": details.Orgname,
	}

	mainHTMLTpl, err := templateGenerator(content, values, h.EmailBase64Logo)
	if err != nil {
		return "", "", fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", details.Name, details.Email, err)
	}
	plainTextTpl = `{{.Name}} granted role {{.Role}} on organization {{.Orgname}}`

	var body bytes.Buffer
	t, _ := template.New("email").Parse(mainHTMLTpl)
	err = t.Execute(&body, details)
	if err != nil {
		return "", "", fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", details.Name, details.Email, err)
	}

	mainHTML += body.String()

	var plainTextBuffer bytes.Buffer
	t, _ = template.New("email").Parse(plainTextTpl)
	err = t.Execute(&plainTextBuffer, details)
	if err != nil {
		return "", "", fmt.Errorf("error generating plaintext template for addAdminToOrganization event %s and project %s: %v", details.Name, details.Email, err)
	}
	plainText += plainTextBuffer.String()

	return mainHTML, plainText, nil
}

func (h *Messaging) handleUserActionToEmail(notification *Notification, rawPayload []byte) error {
	var payload handleUserActionPayload
	if err := json.Unmarshal(rawPayload, &payload); err != nil {
		return err
	}
	// let's check if we need to send an email
	if !payload.Meta.Payload.SendUserEmail {
		if h.EnableDebug {
			log.Printf("Skipping email for '%v' event, user:%s\n", notification.Meta.Event, payload.Meta.Payload.User.Email)
		}
		return nil
	} else {
		if h.EnableDebug {
			log.Printf("Sending email for '%v' event, user:%s\n", notification.Meta.Event, payload.Meta.Payload.User.Email)
		}
	}
	switch notification.Meta.Event {
	case "api:addAdminToOrganization":
		return h.addAdminToOrganization(payload)
	case "api:removeAdminFromOrganization":
		return h.removeAdminFromOrganization(payload)
	case "api:addPlatformRoleToUser":
		return h.addPlatformRoleToUser(payload)
	case "api:removePlatformRoleFromUser":
		return h.removePlatformRoleFromUser(payload)
	}
	return errors.New(fmt.Sprintf("Unable to match incoming notification: %v", notification))
}

func (h *Messaging) addPlatformRoleToUser(payload handleUserActionPayload) error {

	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been assigned the platform role of <strong>{{.Role}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`
	valuesStruct := struct {
		Name    string
		Email   string
		Role    string
		Orgname string
	}{
		Name:    payload.Meta.Payload.User.Email,
		Email:   payload.Meta.Payload.User.Email,
		Role:    payload.Meta.Payload.User.Role,
		Orgname: payload.Meta.Payload.Resource.Details,
	}

	mainHTML, err := templateGenerator(content, valuesStruct, h.EmailBase64Logo)
	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v granted platform role %v", valuesStruct.Name, valuesStruct.Role)
	subject := fmt.Sprintf("User %s Lagoon platform role was updated", valuesStruct.Name)
	if err != nil {
		return fmt.Errorf("error generating email template for addPlatformRoleToUser event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}

	err = h.sendmail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for addPlatformRoleToUser event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}
	return nil
}

func (h *Messaging) removePlatformRoleFromUser(payload handleUserActionPayload) error {

	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been removed from the platform role of <strong>{{.Role}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`
	valuesStruct := struct {
		Name  string
		Email string
		Role  string
	}{
		Name:  payload.Meta.Payload.User.Email,
		Email: payload.Meta.Payload.User.Email,
		Role:  payload.Meta.Payload.User.Role,
	}

	mainHTML, err := templateGenerator(content, valuesStruct, h.EmailBase64Logo)
	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v removed from platform role %v", valuesStruct.Name, valuesStruct.Role)
	subject := fmt.Sprintf("User %s Lagoon platform role was updated", valuesStruct.Name)
	if err != nil {
		return fmt.Errorf("error generating email template for addPlatformRoleToUser event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}

	err = h.sendmail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for addPlatformRoleToUser event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}
	return nil
}

func (h *Messaging) addAdminToOrganization(payload handleUserActionPayload) error {
	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been assigned the role of 
  <strong>{{.Role}}</strong> in the organization <strong>{{.Orgname}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`
	valuesStruct := struct {
		Name    string
		Email   string
		Role    string
		Orgname string
	}{
		Name:    payload.Meta.Payload.User.Email,
		Email:   payload.Meta.Payload.User.Email,
		Role:    payload.Meta.Payload.User.Role,
		Orgname: payload.Meta.Payload.Resource.Details,
	}

	mainHTML, err := templateGenerator(content, valuesStruct, h.EmailBase64Logo)
	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v granted role %v on organization %v", valuesStruct.Name, valuesStruct.Role, valuesStruct.Orgname)
	subject := fmt.Sprintf("User %s role updated for Organization: %v", valuesStruct.Name, valuesStruct.Orgname)
	if err != nil {
		return fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}

	err = h.sendmail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email for addAdminToOrganization event %s and project %s: %v", valuesStruct.Email, valuesStruct.Role, err)
	}
	return nil
}

func (h *Messaging) removeAdminFromOrganization(payload handleUserActionPayload) error {
	content := `
<p>Hello,</p>

<p>
  You (<strong>{{.Name}}</strong>) have been removed from the organization <strong>{{.Orgname}}</strong>.
</p>

<p>
  If you have any questions or need assistance, please contact your organization manager.
</p>
`
	valuesStruct := struct {
		Name    string
		Email   string
		Orgname string
	}{
		Name:    payload.Meta.Payload.User.Email,
		Email:   payload.Meta.Payload.User.Email,
		Orgname: payload.Meta.Payload.Resource.Details,
	}

	mainHTML, err := templateGenerator(content, valuesStruct, h.EmailBase64Logo)
	if err != nil {
		return err
	}
	plainText := fmt.Sprintf("%v removed from organization %v", valuesStruct.Name, valuesStruct.Orgname)
	subject := fmt.Sprintf("User %s removed from Organization: %v", valuesStruct.Name, valuesStruct.Orgname)
	if err != nil {
		return fmt.Errorf("error generating email template for removing user %s and from organization: %v", valuesStruct.Email, valuesStruct.Orgname, err)
	}

	err = h.sendmail(valuesStruct.Email, subject, mainHTML, plainText)
	if err != nil {
		return fmt.Errorf("error sending email when removing user %s and from organization: %v", valuesStruct.Email, valuesStruct.Orgname, err)
	}
	return nil
}

func (h *Messaging) sendmail(emailAddr, subject, mainHTML, plainText string) error {
	// now we can send the email
	mainHTMLBuffer := bytes.Buffer{}
	mainHTMLBuffer.WriteString(mainHTML)
	err := h.deliverEmail(emailAddr, subject, plainText, mainHTMLBuffer)
	if err != nil {
		return err
	}
	return nil
}
