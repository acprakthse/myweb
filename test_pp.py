import pandapower as pp
import pandapower.networks as pn
print("pandapower", pp.__version__)
net = pn.case9()
pp.runpp(net)
print("converged:", net.converged)
