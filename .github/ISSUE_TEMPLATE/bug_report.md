---
name: Bug report
about: Signaler un bug
title: ''
labels: bug
assignees: ''

---

name: 🐛Bug Report
description: File a bug report here
title: "[BUG]: "
labels: ["bug"]
assignees: ["AnishDe12020"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report!!!
  - type: checkboxes
    id: new-bug
    attributes:
      label: Is there an existing issue for this?
      description: Please search to see if an issue already exists for the bug you encountered.
      options:
      - label: I have searched the existing issues
        required: true
  - type: textarea
    id: bug-description
    attributes:
      label: Description of the bug
      description: Tell us what bug you encountered and what should have happened
    validations:
      required: true
  - type: textarea
    id: steps-to-reproduce
    attributes:
      label: Steps To Reproduce
      description: Steps to reproduce the behavior.
      placeholder: Please write the steps in a list form
    validations:
      required: true
  - type: dropdown
    id: versions
    attributes:
      label: Which version of the app are you using?
      description: If this issue is occurring on more than 1 version of the app, select the appropriate versions.
      multiple: true
      options:
       - 1.0.0
       - 1.1.0
       - 1.2.0
       - 2.0.0
       - 2.1.0
    validations:
      required: true
