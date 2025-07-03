---
title: System tools
subtitle: Update the internal state of conversations without external requests.
---

**System tools** enable your assistant to update the internal state of a conversation. Unlike [server tools](/docs/conversational-ai/customization/tools/server-tools) or [client tools](/docs/conversational-ai/customization/tools/client-tools), system tools don't make external API calls or trigger client-side functions—they modify the internal state of the conversation without making external calls.

## Overview

Some applications require agents to control the flow or state of a conversation.
System tools provide this capability by allowing the assistant to perform actions related to the state of the call that don't require communicating with external servers or the client.

### Available system tools

<CardGroup cols={2}>
  <Card
    title="End call"
    icon="duotone square-phone-hangup"
    href="/docs/conversational-ai/customization/tools/system-tools/end-call"
  >
    Let your agent automatically terminate a conversation when appropriate conditions are met.
  </Card>
  <Card
    title="Language detection"
    icon="duotone earth-europe"
    href="/docs/conversational-ai/customization/tools/system-tools/language-detection"
  >
    Enable your agent to automatically switch to the user's language during conversations.
  </Card>
  <Card
    title="Agent transfer"
    icon="duotone arrow-right-arrow-left"
    href="/docs/conversational-ai/customization/tools/system-tools/agent-transfer"
  >
    Seamlessly transfer conversations between AI agents based on defined conditions.
  </Card>
  <Card
    title="Transfer to human"
    icon="duotone user-headset"
    href="/docs/conversational-ai/customization/tools/system-tools/transfer-to-human"
  >
    Seamlessly transfer the user to a human operator.
  </Card>
  <Card
    title="Skip turn"
    icon="duotone forward"
    href="/docs/conversational-ai/customization/tools/system-tools/skip-turn"
  >
    Enable the agent to skip their turns if the LLM detects the agent should not speak yet.
  </Card>
</CardGroup>

## Implementation

When creating an agent via API, you can add system tools to your agent configuration. Here's how to implement both the end call and language detection tools:

## Custom LLM integration

When using a custom LLM with ElevenLabs agents, system tools are exposed as function definitions that your LLM can call. Each system tool has specific parameters and trigger conditions:

### Available system tools

<AccordionGroup>
  <Accordion title="End call">
    ## Custom LLM integration
    
    **Purpose**: Automatically terminate conversations when appropriate conditions are met.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - The main task has been completed and user is satisfied
    - The conversation reached natural conclusion with mutual agreement
    - The user explicitly indicates they want to end the conversation
    
    **Parameters**:
    
    - `reason` (string, required): The reason for ending the call
    - `message` (string, optional): A farewell message to send to the user before ending the call
    
    **Function call format**:
    
    ```json
{
      "type": "function",
      "function": {
        "name": "end_call",
        "arguments": "{\"reason\": \"Task completed successfully\", \"message\": \"Thank you for using our service. Have a great day!\"}"
      }
    }
```
    
    **Implementation**: Configure as a system tool in your agent settings. The LLM will receive detailed instructions about when to call this function.
    

    Learn more: [End call tool](/docs/conversational-ai/customization/tools/end-call)

  </Accordion>

  <Accordion title="Language detection">
    ## Custom LLM integration
    
    **Purpose**: Automatically switch to the user's detected language during conversations.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - User speaks in a different language than the current conversation language
    - User explicitly requests to switch languages
    - Multi-language support is needed for the conversation
    
    **Parameters**:
    
    - `reason` (string, required): The reason for the language switch
    - `language` (string, required): The language code to switch to (must be in supported languages list)
    
    **Function call format**:
    
    ```json
{
      "type": "function",
      "function": {
        "name": "language_detection",
        "arguments": "{\"reason\": \"User requested Spanish\", \"language\": \"es\"}"
      }
    }
```
    
    **Implementation**: Configure supported languages in agent settings and add the language detection system tool. The agent will automatically switch voice and responses to match detected languages.
    

    Learn more: [Language detection tool](/docs/conversational-ai/customization/tools/language-detection)

  </Accordion>

  <Accordion title="Agent transfer">
    ## Custom LLM integration
    
    **Purpose**: Transfer conversations between specialized AI agents based on user needs.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - User request requires specialized knowledge or different agent capabilities
    - Current agent cannot adequately handle the query
    - Conversation flow indicates need for different agent type
    
    **Parameters**:
    
    - `reason` (string, optional): The reason for the agent transfer
    - `agent_number` (integer, required): Zero-indexed number of the agent to transfer to (based on configured transfer rules)
    
    **Function call format**:
    
    ```json
{
      "type": "function",
      "function": {
        "name": "transfer_to_agent",
        "arguments": "{\"reason\": \"User needs billing support\", \"agent_number\": 0}"
      }
    }
```
    
    **Implementation**: Define transfer rules mapping conditions to specific agent IDs. Configure which agents the current agent can transfer to. Agents are referenced by zero-indexed numbers in the transfer configuration.
    

    Learn more: [Agent transfer tool](/docs/conversational-ai/customization/tools/agent-transfer)

  </Accordion>

  <Accordion title="Transfer to human">
    ## Custom LLM integration
    
    **Purpose**: Seamlessly hand off conversations to human operators when AI assistance is insufficient.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - Complex issues requiring human judgment
    - User explicitly requests human assistance
    - AI reaches limits of capability for the specific request
    - Escalation protocols are triggered
    
    **Parameters**:
    
    - `reason` (string, optional): The reason for the transfer
    - `transfer_number` (string, required): The phone number to transfer to (must match configured numbers)
    - `client_message` (string, required): Message read to the client while waiting for transfer
    - `agent_message` (string, required): Message for the human operator receiving the call
    
    **Function call format**:
    
    ```json
{
      "type": "function",
      "function": {
        "name": "transfer_to_number",
        "arguments": "{\"reason\": \"Complex billing issue\", \"transfer_number\": \"+15551234567\", \"client_message\": \"I'm transferring you to a billing specialist who can help with your account.\", \"agent_message\": \"Customer has a complex billing dispute about order #12345 from last month.\"}"
      }
    }
```
    
    **Implementation**: Configure transfer phone numbers and conditions. Define messages for both customer and receiving human operator. Works with both Twilio and SIP trunking.
    

    Learn more: [Transfer to human tool](/docs/conversational-ai/customization/tools/human-transfer)

  </Accordion>

  <Accordion title="Skip turn">
    ## Custom LLM integration
    
    **Purpose**: Allow the agent to pause and wait for user input without speaking.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - User indicates they need a moment ("Give me a second", "Let me think")
    - User requests pause in conversation flow
    - Agent detects user needs time to process information
    
    **Parameters**:
    
    - `reason` (string, optional): Free-form reason explaining why the pause is needed
    
    **Function call format**:
    
    ```json
{
      "type": "function",
      "function": {
        "name": "skip_turn",
        "arguments": "{\"reason\": \"User requested time to think\"}"
      }
    }
```
    
    **Implementation**: No additional configuration needed. The tool simply signals the agent to remain silent until the user speaks again.
    

    Learn more: [Skip turn tool](/docs/conversational-ai/customization/tools/skip-turn)

  </Accordion>
</AccordionGroup>

<CodeGroup>

```python
from elevenlabs import (
    ConversationalConfig,
    ElevenLabs,
    AgentConfig,
    PromptAgent,
    PromptAgentInputToolsItem_System,
)

# Initialize the client
elevenlabs = ElevenLabs(api_key="YOUR_API_KEY")

# Create system tools
end_call_tool = PromptAgentInputToolsItem_System(
    name="end_call",
    description=""  # Optional: Customize when the tool should be triggered
)

language_detection_tool = PromptAgentInputToolsItem_System(
    name="language_detection",
    description=""  # Optional: Customize when the tool should be triggered
)

# Create the agent configuration with both tools
conversation_config = ConversationalConfig(
    agent=AgentConfig(
        prompt=PromptAgent(
            tools=[end_call_tool, language_detection_tool]
        )
    )
)

# Create the agent
response = elevenlabs.conversational_ai.agents.create(
    conversation_config=conversation_config
)
```

```javascript
import { ElevenLabs } from '@elevenlabs/elevenlabs-js';

// Initialize the client
const elevenlabs = new ElevenLabs({
  apiKey: 'YOUR_API_KEY',
});

// Create the agent with system tools
await elevenlabs.conversationalAi.agents.create({
  conversationConfig: {
    agent: {
      prompt: {
        tools: [
          {
            type: 'system',
            name: 'end_call',
            description: '',
          },
          {
            type: 'system',
            name: 'language_detection',
            description: '',
          },
        ],
      },
    },
  },
});
```

</CodeGroup>

## FAQ

<AccordionGroup>
  <Accordion title="Can system tools be combined with other tool types?">
    Yes, system tools can be used alongside server tools and client tools in the same assistant.
    This allows for comprehensive functionality that combines internal state management with
    external interactions.
  </Accordion>
</AccordionGroup>
```
---
title: System tools
subtitle: Update the internal state of conversations without external requests.
---

**System tools** enable your assistant to update the internal state of a conversation. Unlike [server tools](/docs/conversational-ai/customization/tools/server-tools) or [client tools](/docs/conversational-ai/customization/tools/client-tools), system tools don't make external API calls or trigger client-side functions—they modify the internal state of the conversation without making external calls.

## Overview

Some applications require agents to control the flow or state of a conversation.
System tools provide this capability by allowing the assistant to perform actions related to the state of the call that don't require communicating with external servers or the client.

### Available system tools

<CardGroup cols={2}>
  <Card
    title="End call"
    icon="duotone square-phone-hangup"
    href="/docs/conversational-ai/customization/tools/system-tools/end-call"
  >
    Let your agent automatically terminate a conversation when appropriate conditions are met.
  </Card>
  <Card
    title="Language detection"
    icon="duotone earth-europe"
    href="/docs/conversational-ai/customization/tools/system-tools/language-detection"
  >
    Enable your agent to automatically switch to the user's language during conversations.
  </Card>
  <Card
    title="Agent transfer"
    icon="duotone arrow-right-arrow-left"
    href="/docs/conversational-ai/customization/tools/system-tools/agent-transfer"
  >
    Seamlessly transfer conversations between AI agents based on defined conditions.
  </Card>
  <Card
    title="Transfer to human"
    icon="duotone user-headset"
    href="/docs/conversational-ai/customization/tools/system-tools/transfer-to-human"
  >
    Seamlessly transfer the user to a human operator.
  </Card>
  <Card
    title="Skip turn"
    icon="duotone forward"
    href="/docs/conversational-ai/customization/tools/system-tools/skip-turn"
  >
    Enable the agent to skip their turns if the LLM detects the agent should not speak yet.
  </Card>
</CardGroup>

## Implementation

When creating an agent via API, you can add system tools to your agent configuration. Here's how to implement both the end call and language detection tools:

## Custom LLM integration

When using a custom LLM with ElevenLabs agents, system tools are exposed as function definitions that your LLM can call. Each system tool has specific parameters and trigger conditions:

### Available system tools

<AccordionGroup>
  <Accordion title="End call">
    ## Custom LLM integration
    
    **Purpose**: Automatically terminate conversations when appropriate conditions are met.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - The main task has been completed and user is satisfied
    - The conversation reached natural conclusion with mutual agreement
    - The user explicitly indicates they want to end the conversation
    
    **Parameters**:
    
    - `reason` (string, required): The reason for ending the call
    - `message` (string, optional): A farewell message to send to the user before ending the call
    
    **Function call format**:
    
    ```json
    {
      "type": "function",
      "function": {
        "name": "end_call",
        "arguments": "{\"reason\": \"Task completed successfully\", \"message\": \"Thank you for using our service. Have a great day!\"}"
      }
    }
    ```
    
    **Implementation**: Configure as a system tool in your agent settings. The LLM will receive detailed instructions about when to call this function.
    

    Learn more: [End call tool](/docs/conversational-ai/customization/tools/end-call)

  </Accordion>

  <Accordion title="Language detection">
    ## Custom LLM integration
    
    **Purpose**: Automatically switch to the user's detected language during conversations.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - User speaks in a different language than the current conversation language
    - User explicitly requests to switch languages
    - Multi-language support is needed for the conversation
    
    **Parameters**:
    
    - `reason` (string, required): The reason for the language switch
    - `language` (string, required): The language code to switch to (must be in supported languages list)
    
    **Function call format**:
    
    ```json
    {
      "type": "function",
      "function": {
        "name": "language_detection",
        "arguments": "{\"reason\": \"User requested Spanish\", \"language\": \"es\"}"
      }
    }
    ```
    
    **Implementation**: Configure supported languages in agent settings and add the language detection system tool. The agent will automatically switch voice and responses to match detected languages.
    

    Learn more: [Language detection tool](/docs/conversational-ai/customization/tools/language-detection)

  </Accordion>

  <Accordion title="Agent transfer">
    ## Custom LLM integration
    
    **Purpose**: Transfer conversations between specialized AI agents based on user needs.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - User request requires specialized knowledge or different agent capabilities
    - Current agent cannot adequately handle the query
    - Conversation flow indicates need for different agent type
    
    **Parameters**:
    
    - `reason` (string, optional): The reason for the agent transfer
    - `agent_number` (integer, required): Zero-indexed number of the agent to transfer to (based on configured transfer rules)
    
    **Function call format**:
    
    ```json
    {
      "type": "function",
      "function": {
        "name": "transfer_to_agent",
        "arguments": "{\"reason\": \"User needs billing support\", \"agent_number\": 0}"
      }
    }
    ```
    
    **Implementation**: Define transfer rules mapping conditions to specific agent IDs. Configure which agents the current agent can transfer to. Agents are referenced by zero-indexed numbers in the transfer configuration.
    

    Learn more: [Agent transfer tool](/docs/conversational-ai/customization/tools/agent-transfer)

  </Accordion>

  <Accordion title="Transfer to human">
    ## Custom LLM integration
    
    **Purpose**: Seamlessly hand off conversations to human operators when AI assistance is insufficient.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - Complex issues requiring human judgment
    - User explicitly requests human assistance
    - AI reaches limits of capability for the specific request
    - Escalation protocols are triggered
    
    **Parameters**:
    
    - `reason` (string, optional): The reason for the transfer
    - `transfer_number` (string, required): The phone number to transfer to (must match configured numbers)
    - `client_message` (string, required): Message read to the client while waiting for transfer
    - `agent_message` (string, required): Message for the human operator receiving the call
    
    **Function call format**:
    
    ```json
    {
      "type": "function",
      "function": {
        "name": "transfer_to_number",
        "arguments": "{\"reason\": \"Complex billing issue\", \"transfer_number\": \"+15551234567\", \"client_message\": \"I'm transferring you to a billing specialist who can help with your account.\", \"agent_message\": \"Customer has a complex billing dispute about order #12345 from last month.\"}"
      }
    }
    ```
    
    **Implementation**: Configure transfer phone numbers and conditions. Define messages for both customer and receiving human operator. Works with both Twilio and SIP trunking.
    

    Learn more: [Transfer to human tool](/docs/conversational-ai/customization/tools/human-transfer)

  </Accordion>

  <Accordion title="Skip turn">
    ## Custom LLM integration
    
    **Purpose**: Allow the agent to pause and wait for user input without speaking.
    
    **Trigger conditions**: The LLM should call this tool when:
    
    - User indicates they need a moment ("Give me a second", "Let me think")
    - User requests pause in conversation flow
    - Agent detects user needs time to process information
    
    **Parameters**:
    
    - `reason` (string, optional): Free-form reason explaining why the pause is needed
    
    **Function call format**:
    
    ```json
    {
      "type": "function",
      "function": {
        "name": "skip_turn",
        "arguments": "{\"reason\": \"User requested time to think\"}"
      }
    }
    ```
    
    **Implementation**: No additional configuration needed. The tool simply signals the agent to remain silent until the user speaks again.
    

    Learn more: [Skip turn tool](/docs/conversational-ai/customization/tools/skip-turn)

  </Accordion>
</AccordionGroup>

<CodeGroup>

```python
from elevenlabs import (
    ConversationalConfig,
    ElevenLabs,
    AgentConfig,
    PromptAgent,
    PromptAgentInputToolsItem_System,
)

# Initialize the client
elevenlabs = ElevenLabs(api_key="YOUR_API_KEY")

# Create system tools
end_call_tool = PromptAgentInputToolsItem_System(
    name="end_call",
    description=""  # Optional: Customize when the tool should be triggered
)

language_detection_tool = PromptAgentInputToolsItem_System(
    name="language_detection",
    description=""  # Optional: Customize when the tool should be triggered
)

# Create the agent configuration with both tools
conversation_config = ConversationalConfig(
    agent=AgentConfig(
        prompt=PromptAgent(
            tools=[end_call_tool, language_detection_tool]
        )
    )
)

# Create the agent
response = elevenlabs.conversational_ai.agents.create(
    conversation_config=conversation_config
)
```

```javascript
import { ElevenLabs } from '@elevenlabs/elevenlabs-js';

// Initialize the client
const elevenlabs = new ElevenLabs({
  apiKey: 'YOUR_API_KEY',
});

// Create the agent with system tools
await elevenlabs.conversationalAi.agents.create({
  conversationConfig: {
    agent: {
      prompt: {
        tools: [
          {
            type: 'system',
            name: 'end_call',
            description: '',
          },
          {
            type: 'system',
            name: 'language_detection',
            description: '',
          },
        ],
      },
    },
  },
});
```

</CodeGroup>

## FAQ

<AccordionGroup>
  <Accordion title="Can system tools be combined with other tool types?">
    Yes, system tools can be used alongside server tools and client tools in the same assistant.
    This allows for comprehensive functionality that combines internal state management with
    external interactions.
  </Accordion>
</AccordionGroup>
```
---
title: Client tools
subtitle: Empower your assistant to trigger client-side operations.
---

**Client tools** enable your assistant to execute client-side functions. Unlike [server-side tools](/docs/conversational-ai/customization/tools), client tools allow the assistant to perform actions such as triggering browser events, running client-side functions, or sending notifications to a UI.

## Overview

Applications may require assistants to interact directly with the user's environment. Client-side tools give your assistant the ability to perform client-side operations.

Here are a few examples where client tools can be useful:

- **Triggering UI events**: Allow an assistant to trigger browser events, such as alerts, modals or notifications.
- **Interacting with the DOM**: Enable an assistant to manipulate the Document Object Model (DOM) for dynamic content updates or to guide users through complex interfaces.

<Info>
  To perform operations server-side, use
  [server-tools](/docs/conversational-ai/customization/tools/server-tools) instead.
</Info>

## Guide

### Prerequisites

- An [ElevenLabs account](https://elevenlabs.io)
- A configured ElevenLabs Conversational Agent ([create one here](https://elevenlabs.io/app/conversational-ai))

<Steps>
  <Step title="Create a new client-side tool">
    Navigate to your agent dashboard. In the **Tools** section, click **Add Tool**. Ensure the **Tool Type** is set to **Client**. Then configure the following:

| Setting     | Parameter                                                        |
| ----------- | ---------------------------------------------------------------- |
| Name        | logMessage                                                       |
| Description | Use this client-side tool to log a message to the user's client. |

Then create a new parameter `message` with the following configuration:

| Setting     | Parameter                                                                          |
| ----------- | ---------------------------------------------------------------------------------- |
| Data Type   | String                                                                             |
| Identifier  | message                                                                            |
| Required    | true                                                                               |
| Description | The message to log in the console. Ensure the message is informative and relevant. |

    <Frame background="subtle">
      ![logMessage client-tool setup](file:32a7a840-52ed-4947-9460-51edff3e9978)
    </Frame>

  </Step>

  <Step title="Register the client tool in your code">
    Unlike server-side tools, client tools need to be registered in your code.

    Use the following code to register the client tool:

    <CodeBlocks>

      ```python title="Python" focus={4-16}
      from elevenlabs import ElevenLabs
      from elevenlabs.conversational_ai.conversation import Conversation, ClientTools

      def log_message(parameters):
          message = parameters.get("message")
          print(message)

      client_tools = ClientTools()
      client_tools.register("logMessage", log_message)

      conversation = Conversation(
          client=ElevenLabs(api_key="your-api-key"),
          agent_id="your-agent-id",
          client_tools=client_tools,
          # ...
      )

      conversation.start_session()
      ```

      ```javascript title="JavaScript" focus={2-10}
      // ...
      const conversation = await Conversation.startSession({
        // ...
        clientTools: {
          logMessage: async ({message}) => {
            console.log(message);
          }
        },
        // ...
      });
      ```

      ```swift title="Swift" focus={2-10}
      // ...
      var clientTools = ElevenLabsSDK.ClientTools()

      clientTools.register("logMessage") { parameters async throws -> String? in
          guard let message = parameters["message"] as? String else {
              throw ElevenLabsSDK.ClientToolError.invalidParameters
          }
          print(message)
          return message
      }
      ```
    </CodeBlocks>

    <Note>
    The tool and parameter names in the agent configuration are case-sensitive and **must** match those registered in your code.
    </Note>

  </Step>

  <Step title="Testing">
    Initiate a conversation with your agent and say something like:

    > _Log a message to the console that says Hello World_

    You should see a `Hello World` log appear in your console.

  </Step>

  <Step title="Next steps">
    Now that you've set up a basic client-side event, you can:

    - Explore more complex client tools like opening modals, navigating to pages, or interacting with the DOM.
    - Combine client tools with server-side webhooks for full-stack interactions.
    - Use client tools to enhance user engagement and provide real-time feedback during conversations.

  </Step>
</Steps>

### Passing client tool results to the conversation context

When you want your agent to receive data back from a client tool, ensure that you tick the **Wait for response** option in the tool configuration.

<Frame background="subtle">
  <img
    src="file:801f91f5-b2e5-42b4-8f2e-6d29131c0f65"
    alt="Wait for response option in client tool configuration"
  />
</Frame>

Once the client tool is added, when the function is called the agent will wait for its response and append the response to the conversation context.

<CodeBlocks>
    ```python title="Python"
    def get_customer_details():
        # Fetch customer details (e.g., from an API or database)
        customer_data = {
            "id": 123,
            "name": "Alice",
            "subscription": "Pro"
        }
        # Return the customer data; it can also be a JSON string if needed.
        return customer_data

    client_tools = ClientTools()
    client_tools.register("getCustomerDetails", get_customer_details)

    conversation = Conversation(
        client=ElevenLabs(api_key="your-api-key"),
        agent_id="your-agent-id",
        client_tools=client_tools,
        # ...
    )

    conversation.start_session()
    ```

    ```javascript title="JavaScript"
    const clientTools = {
      getCustomerDetails: async () => {
        // Fetch customer details (e.g., from an API)
        const customerData = {
          id: 123,
          name: "Alice",
          subscription: "Pro"
        };
        // Return data directly to the agent.
        return customerData;
      }
    };

    // Start the conversation with client tools configured.
    const conversation = await Conversation.startSession({ clientTools });
    ```

</CodeBlocks>

In this example, when the agent calls **getCustomerDetails**, the function will execute on the client and the agent will receive the returned data, which is then used as part of the conversation context.

### Troubleshooting

<AccordionGroup>
  <Accordion title="Tools not being triggered">
  
    - Ensure the tool and parameter names in the agent configuration match those registered in your code.
    - View the conversation transcript in the agent dashboard to verify the tool is being executed.

  </Accordion>
  <Accordion title="Console errors">

    - Open the browser console to check for any errors.
    - Ensure that your code has necessary error handling for undefined or unexpected parameters.

  </Accordion>
</AccordionGroup>

## Best practices

<h4>Name tools intuitively, with detailed descriptions</h4>

If you find the assistant does not make calls to the correct tools, you may need to update your tool names and descriptions so the assistant more clearly understands when it should select each tool. Avoid using abbreviations or acronyms to shorten tool and argument names.

You can also include detailed descriptions for when a tool should be called. For complex tools, you should include descriptions for each of the arguments to help the assistant know what it needs to ask the user to collect that argument.

<h4>Name tool parameters intuitively, with detailed descriptions</h4>

Use clear and descriptive names for tool parameters. If applicable, specify the expected format for a parameter in the description (e.g., YYYY-mm-dd or dd/mm/yy for a date).

<h4>
  Consider providing additional information about how and when to call tools in your assistant's
  system prompt
</h4>

Providing clear instructions in your system prompt can significantly improve the assistant's tool calling accuracy. For example, guide the assistant with instructions like the following:

```plaintext
Use `check_order_status` when the user inquires about the status of their order, such as 'Where is my order?' or 'Has my order shipped yet?'.
```

Provide context for complex scenarios. For example:

```plaintext
Before scheduling a meeting with `schedule_meeting`, check the user's calendar for availability using check_availability to avoid conflicts.
```

<h4>LLM selection</h4>

<Warning>
  When using tools, we recommend picking high intelligence models like GPT-4o mini or Claude 3.5
  Sonnet and avoiding Gemini 1.5 Flash.
</Warning>

It's important to note that the choice of LLM matters to the success of function calls. Some LLMs can struggle with extracting the relevant parameters from the conversation.

---
title: Server tools
subtitle: Connect your assistant to external data & systems.
---

**Tools** enable your assistant to connect to external data and systems. You can define a set of tools that the assistant has access to, and the assistant will use them where appropriate based on the conversation.

## Overview

Many applications require assistants to call external APIs to get real-time information. Tools give your assistant the ability to make external function calls to third party apps so you can get real-time information.

Here are a few examples where tools can be useful:

- **Fetching data**: enable an assistant to retrieve real-time data from any REST-enabled database or 3rd party integration before responding to the user.
- **Taking action**: allow an assistant to trigger authenticated actions based on the conversation, like scheduling meetings or initiating order returns.

<Info>
  To interact with Application UIs or trigger client-side events use [client
  tools](/docs/conversational-ai/customization/tools/client-tools) instead.
</Info>

## Tool configuration

Conversational AI assistants can be equipped with tools to interact with external APIs. Unlike traditional requests, the assistant generates query, body, and path parameters dynamically based on the conversation and parameter descriptions you provide.

All tool configurations and parameter descriptions help the assistant determine **when** and **how** to use these tools. To orchestrate tool usage effectively, update the assistant’s system prompt to specify the sequence and logic for making these calls. This includes:

- **Which tool** to use and under what conditions.
- **What parameters** the tool needs to function properly.
- **How to handle** the responses.

<br />

<Tabs>

<Tab title="Configuration">
Define a high-level `Name` and `Description` to describe the tool's purpose. This helps the LLM understand the tool and know when to call it.

<Info>
  If the API requires path parameters, include variables in the URL path by wrapping them in curly
  braces `{}`, for example: `/api/resource/{id}` where `id` is a path parameter.
</Info>

<Frame background="subtle">
  ![Configuration](file:4118ecb0-d5a1-4ae3-a7ed-a30af7fd7b45)
</Frame>

</Tab>

<Tab title="Secrets">

Assistant secrets can be used to add authentication headers to requests.

<Frame background="subtle">
  ![Tool secrets](file:0343f065-5f13-427b-aee3-2168f827066d)
</Frame>

</Tab>

<Tab title="Headers">

Specify any headers that need to be included in the request.

<Frame background="subtle">![Headers](file:2a4f1453-e9f3-4fc8-822a-fe862864633d)</Frame>

</Tab>

<Tab title="Path parameters">

Include variables in the URL path by wrapping them in curly braces `{}`:

- **Example**: `/api/resource/{id}` where `id` is a path parameter.

<Frame background="subtle">
  ![Path parameters](file:3e1a2243-dfce-415f-b40e-4d27ea5d93c3)
</Frame>

</Tab>

<Tab title="Body parameters">

Specify any body parameters to be included in the request.

<Frame background="subtle">
  ![Body parameters](file:a258ca6a-4547-4409-a763-cfeef41c57ea)
</Frame>

</Tab>

<Tab title="Query parameters">

Specify any query parameters to be included in the request.

<Frame background="subtle">
  ![Query parameters](file:4bfeb7be-5f16-4217-8361-9bcae0bf3bd7)
</Frame>

</Tab>

</Tabs>

## Guide

In this guide, we'll create a weather assistant that can provide real-time weather information for any location. The assistant will use its geographic knowledge to convert location names into coordinates and fetch accurate weather data.

<div style="padding:104.25% 0 0 0;position:relative;">
  <iframe
    src="https://player.vimeo.com/video/1061374724?h=bd9bdb535e&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
    frameborder="0"
    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
    style="position:absolute;top:0;left:0;width:100%;height:100%;"
    title="weatheragent"
  ></iframe>
</div>
<script src="https://player.vimeo.com/api/player.js"></script>

<Steps>
  <Step title="Configure the weather tool">
    First, on the **Agent** section of your agent settings page, choose **Add Tool**. Select **Webhook** as the Tool Type, then configure the weather API integration:

    <AccordionGroup>
      <Accordion title="Weather Tool Configuration">

      <Tabs>
        <Tab title="Configuration">

        | Field       | Value                                                                                                                                                                            |
        | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
        | Name        | get_weather                                                                                                                                                                      |
        | Description | Gets the current weather forecast for a location                                                                                                                                 |
        | Method      | GET                                                                                                                                                                              |
        | URL         | https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m |

        </Tab>

        <Tab title="Path Parameters">

        | Data Type | Identifier | Value Type | Description                                         |
        | --------- | ---------- | ---------- | --------------------------------------------------- |
        | string    | latitude   | LLM Prompt | The latitude coordinate for the requested location  |
        | string    | longitude  | LLM Prompt | The longitude coordinate for the requested location |

        </Tab>

      </Tabs>

      </Accordion>
    </AccordionGroup>

    <Warning>
      An API key is not required for this tool. If one is required, this should be passed in the headers and stored as a secret.
    </Warning>

  </Step>

  <Step title="Orchestration">
    Configure your assistant to handle weather queries intelligently with this system prompt:

    ```plaintext
System prompt
    You are a helpful conversational AI assistant with access to a weather tool. When users ask about
    weather conditions, use the get_weather tool to fetch accurate, real-time data. The tool requires
    a latitude and longitude - use your geographic knowledge to convert location names to coordinates
    accurately.

    Never ask users for coordinates - you must determine these yourself. Always report weather
    information conversationally, referring to locations by name only. For weather requests:

    1. Extract the location from the user's message
    2. Convert the location to coordinates and call get_weather
    3. Present the information naturally and helpfully

    For non-weather queries, provide friendly assistance within your knowledge boundaries. Always be
    concise, accurate, and helpful.

    First message: "Hey, how can I help you today?"
```

    <Success>
      Test your assistant by asking about the weather in different locations. The assistant should
      handle specific locations ("What's the weather in Tokyo?") and ask for clarification after general queries ("How's
      the weather looking today?").
    </Success>

  </Step>
</Steps>

## Best practices

<h4>Name tools intuitively, with detailed descriptions</h4>

If you find the assistant does not make calls to the correct tools, you may need to update your tool names and descriptions so the assistant more clearly understands when it should select each tool. Avoid using abbreviations or acronyms to shorten tool and argument names.

You can also include detailed descriptions for when a tool should be called. For complex tools, you should include descriptions for each of the arguments to help the assistant know what it needs to ask the user to collect that argument.

<h4>Name tool parameters intuitively, with detailed descriptions</h4>

Use clear and descriptive names for tool parameters. If applicable, specify the expected format for a parameter in the description (e.g., YYYY-mm-dd or dd/mm/yy for a date).

<h4>
  Consider providing additional information about how and when to call tools in your assistant's
  system prompt
</h4>

Providing clear instructions in your system prompt can significantly improve the assistant's tool calling accuracy. For example, guide the assistant with instructions like the following:

```plaintext
Use `check_order_status` when the user inquires about the status of their order, such as 'Where is my order?' or 'Has my order shipped yet?'.
```

Provide context for complex scenarios. For example:

```plaintext
Before scheduling a meeting with `schedule_meeting`, check the user's calendar for availability using check_availability to avoid conflicts.
```

<h4>LLM selection</h4>

<Warning>
  When using tools, we recommend picking high intelligence models like GPT-4o mini or Claude 3.5
  Sonnet and avoiding Gemini 1.5 Flash.
</Warning>

It's important to note that the choice of LLM matters to the success of function calls. Some LLMs can struggle with extracting the relevant parameters from the conversation.

---
title: Server tools
subtitle: Connect your assistant to external data & systems.
---

**Tools** enable your assistant to connect to external data and systems. You can define a set of tools that the assistant has access to, and the assistant will use them where appropriate based on the conversation.

## Overview

Many applications require assistants to call external APIs to get real-time information. Tools give your assistant the ability to make external function calls to third party apps so you can get real-time information.

Here are a few examples where tools can be useful:

- **Fetching data**: enable an assistant to retrieve real-time data from any REST-enabled database or 3rd party integration before responding to the user.
- **Taking action**: allow an assistant to trigger authenticated actions based on the conversation, like scheduling meetings or initiating order returns.

<Info>
  To interact with Application UIs or trigger client-side events use [client
  tools](/docs/conversational-ai/customization/tools/client-tools) instead.
</Info>

## Tool configuration

Conversational AI assistants can be equipped with tools to interact with external APIs. Unlike traditional requests, the assistant generates query, body, and path parameters dynamically based on the conversation and parameter descriptions you provide.

All tool configurations and parameter descriptions help the assistant determine **when** and **how** to use these tools. To orchestrate tool usage effectively, update the assistant’s system prompt to specify the sequence and logic for making these calls. This includes:

- **Which tool** to use and under what conditions.
- **What parameters** the tool needs to function properly.
- **How to handle** the responses.

<br />

<Tabs>

<Tab title="Configuration">
Define a high-level `Name` and `Description` to describe the tool's purpose. This helps the LLM understand the tool and know when to call it.

<Info>
  If the API requires path parameters, include variables in the URL path by wrapping them in curly
  braces `{}`, for example: `/api/resource/{id}` where `id` is a path parameter.
</Info>

<Frame background="subtle">
  ![Configuration](file:4118ecb0-d5a1-4ae3-a7ed-a30af7fd7b45)
</Frame>

</Tab>

<Tab title="Secrets">

Assistant secrets can be used to add authentication headers to requests.

<Frame background="subtle">
  ![Tool secrets](file:0343f065-5f13-427b-aee3-2168f827066d)
</Frame>

</Tab>

<Tab title="Headers">

Specify any headers that need to be included in the request.

<Frame background="subtle">![Headers](file:2a4f1453-e9f3-4fc8-822a-fe862864633d)</Frame>

</Tab>

<Tab title="Path parameters">

Include variables in the URL path by wrapping them in curly braces `{}`:

- **Example**: `/api/resource/{id}` where `id` is a path parameter.

<Frame background="subtle">
  ![Path parameters](file:3e1a2243-dfce-415f-b40e-4d27ea5d93c3)
</Frame>

</Tab>

<Tab title="Body parameters">

Specify any body parameters to be included in the request.

<Frame background="subtle">
  ![Body parameters](file:a258ca6a-4547-4409-a763-cfeef41c57ea)
</Frame>

</Tab>

<Tab title="Query parameters">

Specify any query parameters to be included in the request.

<Frame background="subtle">
  ![Query parameters](file:4bfeb7be-5f16-4217-8361-9bcae0bf3bd7)
</Frame>

</Tab>

</Tabs>

## Guide

In this guide, we'll create a weather assistant that can provide real-time weather information for any location. The assistant will use its geographic knowledge to convert location names into coordinates and fetch accurate weather data.

<div style="padding:104.25% 0 0 0;position:relative;">
  <iframe
    src="https://player.vimeo.com/video/1061374724?h=bd9bdb535e&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
    frameborder="0"
    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
    style="position:absolute;top:0;left:0;width:100%;height:100%;"
    title="weatheragent"
  ></iframe>
</div>
<script src="https://player.vimeo.com/api/player.js"></script>

<Steps>
  <Step title="Configure the weather tool">
    First, on the **Agent** section of your agent settings page, choose **Add Tool**. Select **Webhook** as the Tool Type, then configure the weather API integration:

    <AccordionGroup>
      <Accordion title="Weather Tool Configuration">

      <Tabs>
        <Tab title="Configuration">

        | Field       | Value                                                                                                                                                                            |
        | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
        | Name        | get_weather                                                                                                                                                                      |
        | Description | Gets the current weather forecast for a location                                                                                                                                 |
        | Method      | GET                                                                                                                                                                              |
        | URL         | https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m |

        </Tab>

        <Tab title="Path Parameters">

        | Data Type | Identifier | Value Type | Description                                         |
        | --------- | ---------- | ---------- | --------------------------------------------------- |
        | string    | latitude   | LLM Prompt | The latitude coordinate for the requested location  |
        | string    | longitude  | LLM Prompt | The longitude coordinate for the requested location |

        </Tab>

      </Tabs>

      </Accordion>
    </AccordionGroup>

    <Warning>
      An API key is not required for this tool. If one is required, this should be passed in the headers and stored as a secret.
    </Warning>

  </Step>

  <Step title="Orchestration">
    Configure your assistant to handle weather queries intelligently with this system prompt:

    ```plaintext System prompt
    You are a helpful conversational AI assistant with access to a weather tool. When users ask about
    weather conditions, use the get_weather tool to fetch accurate, real-time data. The tool requires
    a latitude and longitude - use your geographic knowledge to convert location names to coordinates
    accurately.

    Never ask users for coordinates - you must determine these yourself. Always report weather
    information conversationally, referring to locations by name only. For weather requests:

    1. Extract the location from the user's message
    2. Convert the location to coordinates and call get_weather
    3. Present the information naturally and helpfully

    For non-weather queries, provide friendly assistance within your knowledge boundaries. Always be
    concise, accurate, and helpful.

    First message: "Hey, how can I help you today?"
    ```

    <Success>
      Test your assistant by asking about the weather in different locations. The assistant should
      handle specific locations ("What's the weather in Tokyo?") and ask for clarification after general queries ("How's
      the weather looking today?").
    </Success>

  </Step>
</Steps>

## Best practices

<h4>Name tools intuitively, with detailed descriptions</h4>

If you find the assistant does not make calls to the correct tools, you may need to update your tool names and descriptions so the assistant more clearly understands when it should select each tool. Avoid using abbreviations or acronyms to shorten tool and argument names.

You can also include detailed descriptions for when a tool should be called. For complex tools, you should include descriptions for each of the arguments to help the assistant know what it needs to ask the user to collect that argument.

<h4>Name tool parameters intuitively, with detailed descriptions</h4>

Use clear and descriptive names for tool parameters. If applicable, specify the expected format for a parameter in the description (e.g., YYYY-mm-dd or dd/mm/yy for a date).

<h4>
  Consider providing additional information about how and when to call tools in your assistant's
  system prompt
</h4>

Providing clear instructions in your system prompt can significantly improve the assistant's tool calling accuracy. For example, guide the assistant with instructions like the following:

```plaintext
Use `check_order_status` when the user inquires about the status of their order, such as 'Where is my order?' or 'Has my order shipped yet?'.
```

Provide context for complex scenarios. For example:

```plaintext
Before scheduling a meeting with `schedule_meeting`, check the user's calendar for availability using check_availability to avoid conflicts.
```

<h4>LLM selection</h4>

<Warning>
  When using tools, we recommend picking high intelligence models like GPT-4o mini or Claude 3.5
  Sonnet and avoiding Gemini 1.5 Flash.
</Warning>

It's important to note that the choice of LLM matters to the success of function calls. Some LLMs can struggle with extracting the relevant parameters from the conversation.

