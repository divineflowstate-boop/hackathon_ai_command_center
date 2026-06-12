package com.acb;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.*;
import java.util.regex.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AcbController {
  private final JdbcTemplate jdbc;
  public AcbController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  @PostConstruct
  void init() {
    jdbc.execute("CREATE TABLE IF NOT EXISTS agents(id INTEGER PRIMARY KEY AUTOINCREMENT, agent_name TEXT UNIQUE, lob TEXT, team TEXT, owner TEXT, model TEXT, use_case_id TEXT, mission TEXT, status TEXT, risk INTEGER, pid INTEGER, port INTEGER, is_banned INTEGER DEFAULT 0, last_seen TEXT, prompt_hash TEXT, system_prompt TEXT, monthly_cost REAL DEFAULT 0, monthly_tokens INTEGER DEFAULT 0)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS tools(id INTEGER PRIMARY KEY AUTOINCREMENT, tool_name TEXT UNIQUE, role TEXT, description TEXT, globally_approved INTEGER DEFAULT 0)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS agent_tools(agent_id INTEGER, tool_id INTEGER, approved INTEGER DEFAULT 0, PRIMARY KEY(agent_id, tool_id))");
    jdbc.execute("CREATE TABLE IF NOT EXISTS approvals(id INTEGER PRIMARY KEY AUTOINCREMENT, agent_id INTEGER, tool_id INTEGER, type TEXT, status TEXT, reason TEXT, created_at TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS activity(id INTEGER PRIMARY KEY AUTOINCREMENT, agent_name TEXT, event_type TEXT, message TEXT, severity TEXT, created_at TEXT)");
    jdbc.execute("CREATE TABLE IF NOT EXISTS token_usage(id INTEGER PRIMARY KEY AUTOINCREMENT, agent_name TEXT, lob TEXT, team TEXT, model TEXT, tokens_in INTEGER, tokens_out INTEGER, cost REAL, created_at TEXT)");
    seed();
  }

  private void seed() {
    Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM agents", Integer.class);
    if (count != null && count > 0) return;
    upsertTool("athena.query", "READ", "Query approved data lake tables", 1);
    upsertTool("s3.read", "READ", "Read governed S3 datasets", 1);
    upsertTool("iceberg.scan", "READ", "Scan governed Iceberg tables", 1);
    upsertTool("jira.createIssue", "WRITE", "Create operational Jira tickets", 1);
    createAgent("Recon Investigator", "CIB", "IRECS Recon", "Recon Platform", "Claude Sonnet", "UC-RECON-001", "Investigates reconciliation breaks", "APPROVED", 12, 4321, 9101, "You are a recon investigation agent", 62200, 1280.50);
    createAgent("KYC Review Agent", "CB", "KYC Ops", "KYC Platform", "GPT-4.1", "UC-KYC-021", "Reviews KYC exceptions", "APPROVED", 18, 4322, 9102, "You are a KYC review agent", 38200, 720.25);
    createAgent("Fraud Signal Agent", "CCB", "Fraud Analytics", "Fraud Platform", "Claude Haiku", "UC-FRAUD-008", "Monitors fraud signals", "UNDER_REVIEW", 82, 4323, 9103, "You are a fraud signal agent", 114000, 2850.75);
    linkTool("Recon Investigator", "athena.query", 1); linkTool("Recon Investigator", "s3.read", 1); linkTool("Recon Investigator", "iceberg.scan", 1);
    linkTool("KYC Review Agent", "athena.query", 1); linkTool("KYC Review Agent", "jira.createIssue", 1);
    linkTool("Fraud Signal Agent", "athena.query", 1);
    addActivity("Recon Investigator", "TOOL_CALL", "Recon Investigator called athena.query", "LOW");
    addActivity("Fraud Signal Agent", "THREAT", "Unapproved agent requires admin review", "HIGH");
  }

  @GetMapping("/agents") public List<Map<String,Object>> agents() { return jdbc.queryForList("SELECT * FROM agents ORDER BY is_banned DESC, risk DESC, last_seen DESC"); }
  @GetMapping("/agents/{id}") public Map<String,Object> agent(@PathVariable int id) {
    Map<String,Object> a = jdbc.queryForMap("SELECT * FROM agents WHERE id=?", id);
    a.put("tools", jdbc.queryForList("SELECT t.*, at.approved FROM tools t JOIN agent_tools at ON t.id=at.tool_id WHERE at.agent_id=?", id));
    a.put("activity", jdbc.queryForList("SELECT * FROM activity WHERE agent_name=? ORDER BY id DESC LIMIT 20", a.get("agent_name")));
    return a;
  }
  @GetMapping("/activity") public List<Map<String,Object>> activity() { return jdbc.queryForList("SELECT * FROM activity ORDER BY id DESC LIMIT 50"); }
  @GetMapping("/approvals") public List<Map<String,Object>> approvals() { return jdbc.queryForList("SELECT ap.*, a.agent_name, a.lob, a.team, a.model, t.tool_name, t.description FROM approvals ap JOIN agents a ON ap.agent_id=a.id LEFT JOIN tools t ON ap.tool_id=t.id WHERE ap.status='PENDING' ORDER BY ap.id DESC"); }
  @GetMapping("/tools") public List<Map<String,Object>> tools() { return jdbc.queryForList("SELECT t.*, COUNT(at.agent_id) usage_count FROM tools t LEFT JOIN agent_tools at ON t.id=at.tool_id GROUP BY t.id ORDER BY usage_count DESC"); }

  @GetMapping("/metrics") public Map<String,Object> metrics() {
    Map<String,Object> m = new LinkedHashMap<>();
    m.put("summary", jdbc.queryForList("SELECT COUNT(*) agents, SUM(CASE WHEN status='APPROVED' THEN 1 ELSE 0 END) approved, SUM(CASE WHEN status='UNDER_REVIEW' THEN 1 ELSE 0 END) under_review, SUM(is_banned) banned, SUM(monthly_tokens) tokens, ROUND(SUM(monthly_cost),2) cost FROM agents").get(0));
    m.put("tokensByLob", jdbc.queryForList("SELECT lob, SUM(monthly_tokens) tokens, ROUND(SUM(monthly_cost),2) cost FROM agents GROUP BY lob ORDER BY tokens DESC"));
    m.put("topAgents", jdbc.queryForList("SELECT agent_name, lob, team, model, monthly_tokens tokens, ROUND(monthly_cost,2) cost FROM agents ORDER BY monthly_tokens DESC LIMIT 8"));
    m.put("modelUsage", jdbc.queryForList("SELECT model, SUM(monthly_tokens) tokens, ROUND(SUM(monthly_cost),2) cost FROM agents GROUP BY model ORDER BY tokens DESC"));
    return m;
  }

  @PostMapping("/ingest") public Map<String,Object> ingest(@RequestBody IngestRequest req) {
    List<String> lines = req.logs == null ? List.of() : req.logs;
    int processed = 0;
    for (String line : lines) { parseLine(line); processed++; }
    return Map.of("status", "OK", "processed", processed, "time", Instant.now().toString());
  }

  @PostMapping("/approvals/{id}/approve") public ResponseEntity<?> approve(@PathVariable int id) {
    Map<String,Object> ap = jdbc.queryForMap("SELECT * FROM approvals WHERE id=?", id);
    jdbc.update("UPDATE approvals SET status='APPROVED' WHERE id=?", id);
    jdbc.update("UPDATE agent_tools SET approved=1 WHERE agent_id=? AND tool_id=?", ap.get("agent_id"), ap.get("tool_id"));
    jdbc.update("UPDATE agents SET status='APPROVED', risk=MIN(risk,25), is_banned=0 WHERE id=?", ap.get("agent_id"));
    String agent = jdbc.queryForObject("SELECT agent_name FROM agents WHERE id=?", String.class, ap.get("agent_id"));
    addActivity(agent, "APPROVAL", "Admin approved pending tool access", "LOW");
    return ResponseEntity.ok(Map.of("status", "APPROVED"));
  }

  @PostMapping("/approvals/{id}/ban") public ResponseEntity<?> ban(@PathVariable int id) {
    Map<String,Object> ap = jdbc.queryForMap("SELECT * FROM approvals WHERE id=?", id);
    return banAgent(((Number)ap.get("agent_id")).intValue());
  }
  @PostMapping("/agents/{id}/ban") public ResponseEntity<?> banAgent(@PathVariable int id) {
    Map<String,Object> a = jdbc.queryForMap("SELECT * FROM agents WHERE id=?", id);
    long pid = a.get("pid") == null ? -1 : ((Number)a.get("pid")).longValue();
    boolean killed = false;
    if (pid > 0) killed = ProcessHandle.of(pid).map(ph -> { try { return ph.destroyForcibly(); } catch(Exception e){ return false; }}).orElse(false);
    jdbc.update("UPDATE agents SET is_banned=1, status='BANNED', risk=100 WHERE id=?", id);
    jdbc.update("UPDATE approvals SET status='BANNED' WHERE agent_id=?", id);
    addActivity((String)a.get("agent_name"), "BAN", "Admin banned agent. PID kill attempted: "+pid+", killed="+killed, "HIGH");
    return ResponseEntity.ok(Map.of("status", "BANNED", "pid", pid, "killAttempted", pid > 0, "killed", killed));
  }

  @PostMapping("/bureau/ask") public Map<String,Object> ask(@RequestBody Map<String,String> body) {
    String q = body.getOrDefault("question", "").toLowerCase();
    if (q.contains("athena")) return Map.of("answer", "Agents using Athena: " + jdbc.queryForList("SELECT agent_name FROM agents a JOIN agent_tools at ON a.id=at.agent_id JOIN tools t ON t.id=at.tool_id WHERE t.tool_name='athena.query'"), "type", "toolUsage");
    if (q.contains("token") || q.contains("cost")) return Map.of("answer", "Top token consumers are shown below.", "data", jdbc.queryForList("SELECT agent_name, monthly_tokens, monthly_cost FROM agents ORDER BY monthly_tokens DESC LIMIT 5"));
    if (q.contains("under review") || q.contains("threat")) return Map.of("answer", "Agents under review: " + jdbc.queryForList("SELECT agent_name, lob, team, risk FROM agents WHERE status='UNDER_REVIEW' OR status='BANNED'"));
    return Map.of("answer", "Ask about agents, tools, models, token usage, cost, LOB, team, or threats.");
  }

  private void parseLine(String line) {
    Map<String,String> kv = kv(line);
    String event = kv.getOrDefault("event", line.contains("TOOL_CALL") ? "TOOL_CALL" : line.contains("AGENT_START") ? "AGENT_START" : "LOG");
    String agent = kv.getOrDefault("agent", kv.getOrDefault("agent_name", "Unknown Agent"));
    if (event.equals("AGENT_START")) {
      String lob = kv.getOrDefault("lob", "CIB"); String team = kv.getOrDefault("team", "Unknown Team"); String model = kv.getOrDefault("model", "Claude Sonnet");
      int pid = parseInt(kv.get("pid"), -1); int port = parseInt(kv.get("port"), -1); String prompt = kv.getOrDefault("prompt", ""); String uc = kv.getOrDefault("useCase", kv.getOrDefault("use_case", "UC-AUTO"));
      ensureAgent(agent, lob, team, model, uc, pid, port, prompt);
      addActivity(agent, "AGENT_START", "New agent started on PID "+pid+" / port "+port, "MEDIUM");
    } else if (event.equals("TOOL_CALL")) {
      String tool = kv.getOrDefault("tool", "unknown.tool"); String role = kv.getOrDefault("role", "READ"); String desc = kv.getOrDefault("desc", "Observed from runtime logs");
      int in = parseInt(kv.get("tokensIn"), 0); int out = parseInt(kv.get("tokensOut"), 0); double cost = parseDouble(kv.get("cost"), (in+out)*0.00001);
      int agentId = ensureAgent(agent, kv.getOrDefault("lob","CIB"), kv.getOrDefault("team","Unknown Team"), kv.getOrDefault("model","Claude Sonnet"), kv.getOrDefault("useCase","UC-AUTO"), parseInt(kv.get("pid"), -1), parseInt(kv.get("port"), -1), kv.getOrDefault("prompt", ""));
      int toolId = upsertTool(tool, role, desc, 0);
      int globallyApproved = jdbc.queryForObject("SELECT globally_approved FROM tools WHERE id=?", Integer.class, toolId);
      linkTool(agent, tool, globallyApproved);
      jdbc.update("INSERT INTO token_usage(agent_name,lob,team,model,tokens_in,tokens_out,cost,created_at) VALUES(?,?,?,?,?,?,?,?)", agent, kv.getOrDefault("lob","CIB"), kv.getOrDefault("team","Unknown Team"), kv.getOrDefault("model","Claude Sonnet"), in, out, cost, Instant.now().toString());
      jdbc.update("UPDATE agents SET monthly_tokens=monthly_tokens+?, monthly_cost=monthly_cost+?, last_seen=? WHERE id=?", in+out, cost, Instant.now().toString(), agentId);
      if (globallyApproved == 1) { jdbc.update("UPDATE agents SET status='APPROVED', risk=CASE WHEN risk>40 THEN 35 ELSE risk END WHERE id=? AND is_banned=0", agentId); addActivity(agent, "AUTO_APPROVED", "Known approved tool used: "+tool, "LOW"); }
      else { jdbc.update("UPDATE agents SET status='UNDER_REVIEW', risk=85 WHERE id=?", agentId); createApproval(agentId, toolId, "NEW_TOOL", "New unapproved tool detected: "+tool); addActivity(agent, "THREAT", "Unapproved tool detected: "+tool, "HIGH"); }
    }
  }

  private int ensureAgent(String name, String lob, String team, String model, String uc, int pid, int port, String prompt) {
    List<Map<String,Object>> rows = jdbc.queryForList("SELECT * FROM agents WHERE agent_name=?", name);
    String hash = Integer.toHexString(prompt.hashCode());
    if (rows.isEmpty()) {
      jdbc.update("INSERT INTO agents(agent_name,lob,team,owner,model,use_case_id,mission,status,risk,pid,port,last_seen,prompt_hash,system_prompt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)", name,lob,team,team,model,uc,"Discovered from runtime logs","UNDER_REVIEW",70,pid,port,Instant.now().toString(),hash,prompt);
      return jdbc.queryForObject("SELECT id FROM agents WHERE agent_name=?", Integer.class, name);
    }
    Map<String,Object> row = rows.get(0); int id = ((Number)row.get("id")).intValue();
    jdbc.update("UPDATE agents SET lob=?,team=?,model=?,pid=CASE WHEN ?=-1 THEN pid ELSE ? END, port=CASE WHEN ?=-1 THEN port ELSE ? END,last_seen=? WHERE id=?", lob,team,model,pid,pid,port,port,Instant.now().toString(),id);
    if (prompt != null && !prompt.isBlank() && !hash.equals(row.get("prompt_hash"))) { jdbc.update("UPDATE agents SET status='UNDER_REVIEW', risk=78, prompt_hash=?, system_prompt=? WHERE id=?", hash,prompt,id); createApproval(id, null, "PROMPT_CHANGE", "System prompt changed"); }
    return id;
  }

  private void createAgent(String n,String lob,String team,String owner,String model,String uc,String mission,String status,int risk,int pid,int port,String prompt,int tokens,double cost){ jdbc.update("INSERT INTO agents(agent_name,lob,team,owner,model,use_case_id,mission,status,risk,pid,port,last_seen,prompt_hash,system_prompt,monthly_tokens,monthly_cost) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", n,lob,team,owner,model,uc,mission,status,risk,pid,port,Instant.now().toString(),Integer.toHexString(prompt.hashCode()),prompt,tokens,cost); }
  private int upsertTool(String name,String role,String desc,int approved){ jdbc.update("INSERT OR IGNORE INTO tools(tool_name,role,description,globally_approved) VALUES(?,?,?,?)", name,role,desc,approved); if(approved==1) jdbc.update("UPDATE tools SET globally_approved=1 WHERE tool_name=?", name); return jdbc.queryForObject("SELECT id FROM tools WHERE tool_name=?", Integer.class, name); }
  private void linkTool(String agentName,String toolName,int approved){ int aid=jdbc.queryForObject("SELECT id FROM agents WHERE agent_name=?", Integer.class, agentName); int tid=jdbc.queryForObject("SELECT id FROM tools WHERE tool_name=?", Integer.class, toolName); jdbc.update("INSERT OR IGNORE INTO agent_tools(agent_id,tool_id,approved) VALUES(?,?,?)", aid,tid,approved); if(approved==1) jdbc.update("UPDATE agent_tools SET approved=1 WHERE agent_id=? AND tool_id=?", aid,tid); }
  private void createApproval(int aid, Integer tid, String type, String reason){ Integer exists=jdbc.queryForObject("SELECT COUNT(*) FROM approvals WHERE agent_id=? AND IFNULL(tool_id,-1)=IFNULL(?, -1) AND status='PENDING'", Integer.class, aid, tid); if(exists==0) jdbc.update("INSERT INTO approvals(agent_id,tool_id,type,status,reason,created_at) VALUES(?,?,?,?,?,?)", aid,tid,type,"PENDING",reason,Instant.now().toString()); }
  private void addActivity(String agent,String type,String msg,String sev){ jdbc.update("INSERT INTO activity(agent_name,event_type,message,severity,created_at) VALUES(?,?,?,?,?)", agent,type,msg,sev,Instant.now().toString()); }
  private Map<String,String> kv(String line){ Map<String,String> m=new HashMap<>(); Matcher r=Pattern.compile("(\\w+)=\\\"([^\\\"]*)\\\"|(\\w+)=([^\\s]+)").matcher(line); while(r.find()){ if(r.group(1)!=null)m.put(r.group(1),r.group(2)); else m.put(r.group(3),r.group(4)); } return m; }
  private int parseInt(String s,int d){ try{return s==null?d:Integer.parseInt(s);}catch(Exception e){return d;} }
  private double parseDouble(String s,double d){ try{return s==null?d:Double.parseDouble(s);}catch(Exception e){return d;} }
  public static class IngestRequest { public List<String> logs; }
}
