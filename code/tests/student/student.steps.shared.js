import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { createId } from "@paralleldrive/cuid2";
import { JSDOM } from "jsdom";

// code/tests/student/student.steps.shared.js

/**
 * Helper function to parse HTML response and extract data
 */
function parseHtmlResponse(html) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  return {
    document,
    hasElement: (selector) => !!document.querySelector(selector),
    getElementText: (selector) =>
      document.querySelector(selector)?.textContent?.trim(),
    getElementAttribute: (selector, attr) =>
      document.querySelector(selector)?.getAttribute(attr),
    getAllElements: (selector) =>
      Array.from(document.querySelectorAll(selector)),
    hasClass: (selector, className) =>
      document.querySelector(selector)?.classList.contains(className),
    getFormData: () => {
      const form = document.querySelector("form");
      if (!form) return null;

      const formData = {};
      const inputs = form.querySelectorAll(
        "input[name], textarea[name], select[name]"
      );
      inputs.forEach((input) => {
        formData[input.name] = input.value;
      });
      return formData;
    },
  };
}

/**
 * Helper function to make HTMX-style requests
 */
function makeHtmxRequest(method, url, data = null) {
  const req = request[method.toLowerCase()](url)
    .set("HX-Request", "true")
    .set("Content-Type", "application/x-www-form-urlencoded");

  if (data) {
    return req.send(data);
  }
  return req;
}

export const aStudentWithNameAndEmail = (name, email) => {
  context.student = { name, email };
};

export const aStudentWithNameAndEmailHasBeenCreated = async (name, email) => {
  const res = await makeHtmxRequest("post", "/students", { name, email });

  // Parse the HTML response to extract student data
  const parsed = parseHtmlResponse(res.text);

  // Look for the student card in the response
  const studentCards = parsed.getAllElements(".student-card");
  const createdStudent = studentCards.find((card) => {
    const nameElement = card.querySelector(".student-card__name");
    return nameElement && nameElement.textContent.trim() === name;
  });

  if (createdStudent) {
    const studentId = createdStudent.getAttribute("data-student-id");
    context.student = { id: studentId, name, email };
  } else {
    throw new Error(`Could not find created student "${name}" in response`);
  }
};

export const iCreateTheStudent = async () => {
  context.response = await makeHtmxRequest(
    "post",
    "/students",
    context.student
  );
};

export const iGetAllStudents = async () => {
  context.response = await makeHtmxRequest("get", "/students");
};

export const iGetTheStudentById = async () => {
  context.response = await makeHtmxRequest(
    "get",
    `/students/${context.student.id}`
  );
};

export const iGetAStudentByNonExistentId = async () => {
  const nonExistentId = createId();
  context.response = await makeHtmxRequest("get", `/students/${nonExistentId}`);
};

export const iEditTheStudent = async () => {
  context.response = await makeHtmxRequest(
    "get",
    `/students/${context.student.id}/edit`
  );
};

export const iUpdateTheStudentWith = async (name, email) => {
  const updateData = { name, email };
  context.response = await makeHtmxRequest(
    "put",
    `/students/${context.student.id}`,
    updateData
  );

  // Update context with new data
  context.student = { ...context.student, ...updateData };
};

export const iDeleteTheStudent = async () => {
  context.response = await makeHtmxRequest(
    "delete",
    `/students/${context.student.id}`
  );
};

export const iNavigateToCreateStudentForm = async () => {
  context.response = await makeHtmxRequest("get", "/students/new");
};

export const theStudentShouldBeCreatedSuccessfully = () => {
  expect(context.response.status).toBe(201);

  const parsed = parseHtmlResponse(context.response.text);

  // Should contain success message
  expect(parsed.hasElement(".alert--success")).toBe(true);

  // Should contain student list with the new student
  expect(parsed.hasElement(".student-list")).toBe(true);
  expect(parsed.hasElement(".student-card")).toBe(true);
};

export const theStudentShouldBeReturnedSuccessfully = () => {
  expect(context.response.status).toBe(200);

  const parsed = parseHtmlResponse(context.response.text);

  // Should contain a student card
  expect(parsed.hasElement(".student-card")).toBe(true);
};

export const theResponseShouldContainAtLeastOneStudent = () => {
  expect(context.response.status).toBe(200);

  const parsed = parseHtmlResponse(context.response.text);

  // Should contain student list
  expect(parsed.hasElement(".student-list")).toBe(true);

  // Should have at least one student card
  const studentCards = parsed.getAllElements(".student-card");
  expect(studentCards.length).toBeGreaterThan(0);
};

export const theResponseShouldContainStudentWithName = (name) => {
  const parsed = parseHtmlResponse(context.response.text);

  const studentCards = parsed.getAllElements(".student-card");
  const hasStudentWithName = studentCards.some((card) => {
    const nameElement = card.querySelector(".student-card__name");
    return nameElement && nameElement.textContent.trim() === name;
  });

  expect(hasStudentWithName).toBe(true);
};

export const theStudentShouldHaveTheName = (name) => {
  const parsed = parseHtmlResponse(context.response.text);

  const nameElement = parsed.document.querySelector(".student-card__name");
  expect(nameElement?.textContent?.trim()).toBe(name);
};

export const theStudentShouldHaveTheEmail = (email) => {
  const parsed = parseHtmlResponse(context.response.text);

  const emailLink = parsed.document.querySelector(".student-card__email-link");
  expect(emailLink?.textContent?.trim()).toBe(email);
  expect(emailLink?.getAttribute("href")).toBe(`mailto:${email}`);
};

export const theResponseStatusShouldBe = (status) => {
  expect(context.response.status).toBe(parseInt(status, 10));
};

export const theResponseShouldContainAnErrorMessage = () => {
  const parsed = parseHtmlResponse(context.response.text);
  expect(parsed.hasElement(".alert--error")).toBe(true);
};

export const theResponseShouldContainASuccessMessage = () => {
  const parsed = parseHtmlResponse(context.response.text);
  expect(parsed.hasElement(".alert--success")).toBe(true);
};

export const theResponseShouldContainAForm = () => {
  const parsed = parseHtmlResponse(context.response.text);
  expect(parsed.hasElement(".student-form")).toBe(true);
  expect(parsed.hasElement('input[name="name"]')).toBe(true);
  expect(parsed.hasElement('input[name="email"]')).toBe(true);
};

export const theFormShouldBePrefilledWith = (name, email) => {
  const parsed = parseHtmlResponse(context.response.text);

  const nameInput = parsed.document.querySelector('input[name="name"]');
  const emailInput = parsed.document.querySelector('input[name="email"]');

  expect(nameInput?.value).toBe(name);
  expect(emailInput?.value).toBe(email);
};

export const theStudentShouldBeUpdatedSuccessfully = () => {
  expect(context.response.status).toBe(200);

  const parsed = parseHtmlResponse(context.response.text);

  // Should contain success message
  expect(parsed.hasElement(".alert--success")).toBe(true);

  // Should contain updated student list
  expect(parsed.hasElement(".student-list")).toBe(true);
};

export const theStudentShouldBeDeletedSuccessfully = () => {
  expect(context.response.status).toBe(200);

  // For delete operations, HTMX returns empty content
  expect(context.response.text.trim()).toBe("");
};

export const theResponseShouldBeAccessible = () => {
  const parsed = parseHtmlResponse(context.response.text);

  // Check for proper heading structure
  const headings = parsed.getAllElements("h1, h2, h3, h4, h5, h6");
  expect(headings.length).toBeGreaterThan(0);

  // Check for proper labeling of form elements
  const inputs = parsed.getAllElements("input");
  inputs.forEach((input) => {
    const hasLabel =
      input.id && parsed.document.querySelector(`label[for="${input.id}"]`);
    const hasAriaLabel = input.getAttribute("aria-label");
    const hasAriaLabelledBy = input.getAttribute("aria-labelledby");

    expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
  });

  // Check for proper button accessibility
  const buttons = parsed.getAllElements('button, input[type="submit"]');
  buttons.forEach((button) => {
    const hasText = button.textContent?.trim();
    const hasAriaLabel = button.getAttribute("aria-label");

    expect(hasText || hasAriaLabel).toBeTruthy();
  });

  // Check for proper link accessibility
  const links = parsed.getAllElements("a");
  links.forEach((link) => {
    const hasText = link.textContent?.trim();
    const hasAriaLabel = link.getAttribute("aria-label");

    expect(hasText || hasAriaLabel).toBeTruthy();
  });
};
