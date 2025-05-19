package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"text/template"
)

type addAdmintoOrganizationUser struct {
	Id           string `json:"id"`
	Email        string `json:"email"`
	Organization int    `json:"organization"`
	Role         string `json:"role"`
}

type addAdminToOrganizationResource struct {
	Id      int    `json:"id"`
	Type    string `json:"type"`
	Details string `json:"details"` // stores the org name
}

// There is also a third payload struct called "linkedResource" which we could use, but it seems redundant

type addAdminToOrganization struct {
	Meta struct {
		Payload struct {
			User     addAdmintoOrganizationUser     `json:"user"`
			Resource addAdminToOrganizationResource `json:"resource"`
		} `json:"payload"`
	} `json:"meta"`
}

// These are the basic details that should be piped to the email template
type UseractionEmailDetails struct {
	Name  string
	Email string
	Role  string
}

// SendToEmail .
func (h *Messaging) useractionEmailTemplate(details *UseractionEmailDetails) (string, string, string, string, string, error) {

	emoji := infoEmoji
	color := "#E8E8E8"

	var mainHTML, plainText, subject, plainTextTpl, mainHTMLTpl string

	subject = fmt.Sprintf("User %s granted role %s", details.Name, details.Role)

	mainHTMLTpl = `{{.Name}} granted role {{.Role}}`
	plainTextTpl = `{{.Name}} granted role {{.Role}}`

	var body bytes.Buffer
	t, _ := template.New("email").Parse(mainHTMLTpl)
	err := t.Execute(&body, details)
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", details.Name, details.Email, err)
	}

	mainHTML += body.String()

	var plainTextBuffer bytes.Buffer
	t, _ = template.New("email").Parse(plainTextTpl)
	err = t.Execute(&plainTextBuffer, details)
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("error generating plaintext template for addAdminToOrganization event %s and project %s: %v", details.Name, details.Email, err)
	}
	plainText += plainTextBuffer.String()
	if subject == "" {
		subject = plainText
	}
	return emoji, color, subject, mainHTML, plainText, nil
}

func (h *Messaging) handleUserActionToEmail(notification *Notification, rawPayload []byte) error {
	var payload addAdminToOrganization

	if err := json.Unmarshal(rawPayload, &payload); err != nil {
		return err
	}

	// let's grab ourselves the mailer templates
	emoji, color, subject, mainHTML, plainText, err := h.useractionEmailTemplate(&UseractionEmailDetails{
		Name:  payload.Meta.Payload.User.Email,
		Email: payload.Meta.Payload.User.Email,
		Role:  payload.Meta.Payload.User.Role,
	})

	if err != nil {
		return fmt.Errorf("error generating email template for addAdminToOrganization event %s and project %s: %v", payload.Meta.Payload.User.Email, payload.Meta.Payload.User.Role, err)
	}

	// now we can send the email
	h.sendEmailMessage(emoji, color, subject, notification.Meta.Event, notification.Project, payload.Meta.Payload.User.Email, mainHTML, plainText)

	return nil
}
