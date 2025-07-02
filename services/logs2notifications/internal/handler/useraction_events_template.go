package handler

import (
	_ "embed"
	"fmt"
	"strings"
	"text/template"
)

// Here we define the email template for user administration interaction events
// This might usefullly be moved into a compiled template in the future

type TemplateDataGenerator struct {
	ContentTemplate string
	MailTemplate    string
	Image           string
}

func NewTemplateDataGenerator(contentTemplate, mailTemplate, image string) *TemplateDataGenerator {
	return &TemplateDataGenerator{
		ContentTemplate: contentTemplate,
		MailTemplate:    mailTemplate,
		Image:           image,
	}
}

func (templateData *TemplateDataGenerator) Generate(contentValues interface{}) (string, error) {
	return templateGenerator(templateData.ContentTemplate, contentValues, templateData.Image)
}

func templateGenerator(contentTemplate string, contentValues interface{}, image string) (string, error) {

	if contentTemplate == "" {
		return "", fmt.Errorf("content cannot be empty")
	}

	logoImage := defaultTemplateImageBase64
	if image != "" {
		logoImage = image
	}
	t, err := template.New("email").Parse(userInteractionEventsTemplateDisk)
	if err != nil {
		return "", err
	}

	data := struct {
		Content   string
		LogoImage string
	}{
		Content:   contentTemplate,
		LogoImage: logoImage,
	}

	var body strings.Builder

	err = t.Execute(&body, data)
	if err != nil {
		return "", err
	}

	// now let's fill in the content
	var completeMail strings.Builder
	t, err = template.New("emailWithContent").Parse(body.String())
	err = t.Execute(&completeMail, contentValues)
	if err != nil {
		return "", fmt.Errorf("error generating email template: %v", err)
	}
	return completeMail.String(), nil
}

//go:embed "templates/files/defaultTemplateImageBase64.txt"
var defaultTemplateImageBase64 string

//go:embed "templates/userinteraction_event_mail.gotmpl"
var userInteractionEventsTemplateDisk string
