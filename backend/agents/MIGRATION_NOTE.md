# Agent Import Migration Note

## Deprecation Warning

Pylance shows a deprecation warning for:
```python
from langgraph.prebuilt import create_react_agent
```

The warning suggests using:
```python
from langchain.agents import create_agent
```

## Current Status

We are currently using `langgraph.prebuilt.create_react_agent` which is the **correct** import for LangGraph-based multi-agent systems.

## Why Not Changing Yet

1. **LangGraph Context**: The `create_react_agent` from `langgraph.prebuilt` is specifically designed for LangGraph workflows and returns a compiled graph node, not a simple agent.

2. **Different Signatures**: The `create_agent` from `langchain.agents` has a different signature and is meant for standalone LangChain agents, not LangGraph nodes.

3. **Official Documentation**: LangGraph documentation (as of 2024) still uses `langgraph.prebuilt.create_react_agent` as the standard way to create reactive agents in graphs.

## Migration Plan

When the actual migration is needed (breaking change in langgraph):

### Option 1: Use LangGraph's New API
```python
from langgraph.prebuilt import create_react_agent  # Check latest docs for new import path
```

### Option 2: Create Custom Agent Nodes
If `create_react_agent` is fully deprecated, we'll need to:
1. Create custom agent nodes using `@tool` decorators
2. Implement ReAct loop manually
3. Use LangGraph's `@entrypoint` and `@task` patterns

Example:
```python
from langgraph.graph import task, entrypoint
from langchain_google_genai import ChatGoogleGenerativeAI

@task
def call_llm(state):
    llm = ChatGoogleGenerativeAI(...)
    return llm.invoke(state["messages"])

@task
def execute_tool(tool_call):
    # Execute the tool
    pass

@entrypoint()
def supervisor_agent(state):
    response = call_llm(state).result()
    # React loop logic here
    return response
```

## Action Required

- **Monitor**: Watch for official LangGraph migration guides
- **Test**: When migrating, ensure all agent handoffs still work correctly
- **Update**: Update this note when migration is completed

## References

- [LangGraph Multi-Agent Documentation](https://langchain-ai.github.io/langgraph/concepts/multi_agent/)
- [LangGraph create_react_agent](https://langchain-ai.github.io/langgraph/reference/prebuilt/#langgraph.prebuilt.chat_agent_executor.create_react_agent)

## Files Affected

- `agents/supervisor_agent.py` - Line 5, 32
- `agents/local_knowledge_agent.py` - Check if present
- `agents/web_search_agent.py` - Check if present
- `agents/cloud_agent.py` - Check if present

Last Updated: 2024-11-24
