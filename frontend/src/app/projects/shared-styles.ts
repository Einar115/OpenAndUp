export const sharedFormStyles = `
  .link-back {
    display: inline-flex;
    margin-bottom: 0.5rem;
    color: #0ea5e9;
    text-decoration: none;
    font-weight: 600;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-weight: 600;
  }

  input,
  textarea,
  select {
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    padding: 0.65rem 0.75rem;
    font-size: 1rem;
    font-family: inherit;
  }

  .btn {
    align-self: flex-start;
    border-radius: 999px;
    border: none;
    padding: 0.6rem 1.2rem;
    font-weight: 700;
    cursor: pointer;
    color: #fff;
    background: #0ea5e9;
  }

  .btn.primary {
    background: #0ea5e9;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .muted {
    color: #6b7280;
    margin: 0.1rem 0;
  }

  .small {
    font-size: 0.9rem;
  }
`;

export const sharedStyles = sharedFormStyles;
